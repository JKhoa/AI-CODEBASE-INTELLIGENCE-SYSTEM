'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '@/src/context/AppContext';
import Icon from '@/src/components/Icon';
import { Button, Tooltip, Spinner, RichText } from '@/src/components/ui';
import API, { loadLlmCfg } from '@/src/lib/api';
import DATA from '@/src/lib/data';
import cx from '@/src/lib/cx';

// Intent detection: maps user input → kind for the LLM
function detectIntent(text) {
  const lower = text.toLowerCase();
  
  // Vietnamese + English intent patterns
  const intents = [
    { kind: 'locate', patterns: ['tìm', 'ở đâu', 'file nào', 'where', 'find', 'locate', 'search', 'chỗ nào', 'đường dẫn', 'path', 'nằm ở'] },
    { kind: 'audit', patterns: ['bảo mật', 'security', 'vulnerability', 'lỗ hổng', 'audit', 'malware', 'xss', 'injection', 'hack', 'risk', 'rủi ro', 'nguy hiểm', 'danger'] },
    { kind: 'suggest', patterns: ['đề xuất', 'suggest', 'cải thiện', 'improve', 'tối ưu', 'optimize', 'refactor', 'nên', 'should', 'recommend', 'khuyên'] },
    { kind: 'compare', patterns: ['so sánh', 'compare', 'khác nhau', 'difference', 'versus', 'vs', 'giống', 'similar'] },
    { kind: 'explain', patterns: ['giải thích', 'explain', 'kiến trúc', 'architecture', 'cách', 'how', 'what', 'là gì', 'tại sao', 'why', 'hoạt động', 'work', 'cấu trúc', 'structure'] },
  ];

  for (const { kind, patterns } of intents) {
    if (patterns.some(p => lower.includes(p))) return kind;
  }
  return 'explain'; // default
}

export default function AssistantPanel({ session, stage, ready, onOpenFile }) {
  const ctx = useApp(); const t = ctx.t;
  const sid = session.id;
  const isLive = sid === 'sess-acme-orders';
  const isMock = isLive || sid === 'sess-vercel-next';
  const seed = !isMock ? [] : (isLive ? DATA.CHAT_SEED_LIVE : DATA.CHAT_SEED_DONE);

  const [msgs, setMsgs] = useState(() => seed.map((m, i) => ({ ...m, id: 'seed-' + i })));
  const [input, setInput] = useState('');
  const [contextScope, setContextScope] = useState('repo');
  const [streaming, setStreaming] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Persist transcript per-session
  useEffect(() => {
    try { const raw = localStorage.getItem('chat:' + sid); if (raw) setMsgs(JSON.parse(raw)); } catch {}
  }, [sid]);
  useEffect(() => { try { localStorage.setItem('chat:' + sid, JSON.stringify(msgs)); } catch {} }, [msgs, sid]);

  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs.length, streaming]);

  // Build concise scan data to send as context
  const buildScanContext = useCallback(() => {
    if (!session || isMock) return null;
    return {
      repo: session.repo,
      stats: session.stats,
      langs: session.langs,
      arch: session.arch,
      modules: session.modules,
      security: session.security,
      tours: session.tours,
      domains: session.domains,
      tree: session.tree,
      readme: session.readme,
    };
  }, [session, isMock]);

  const send = async (text, kind) => {
    if (!text.trim()) return;
    
    // Auto-detect intent if not specified
    const detectedKind = kind || detectIntent(text);
    
    const userMsg = { id: 'u-' + Date.now(), role: 'user', kind: detectedKind, text: { vi: text, en: text }, t: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    setInput(''); setStreaming(true);

    const isReal = !isMock; let reply;
    const aiId = 'a-' + Date.now();
    setMsgs(prev => [...prev, { id: aiId, role: 'ai', text: { vi: '', en: '' },
      citations: [], provisional: !ready, scope: null,
      streaming: true, t: Date.now() }]);

    if (isReal && await API.probe()) {
      try {
        const cfg = loadLlmCfg();
        const scanData = buildScanContext();
        
        let fullText = '';
        await API.chatStream({
          sessionId: sid, 
          question: text, 
          kind: detectedKind, 
          contextScope,
          provider: cfg.provider, 
          apiKey: cfg.apiKey, 
          model: cfg.model,
          scanData, // Send full scan data for context
        }, (chunk) => {
          fullText += chunk;
          setMsgs(prev => prev.map(m => m.id === aiId ? { ...m, text: { vi: fullText, en: fullText } } : m));
        });
        
        setMsgs(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m));
        setStreaming(false);
      } catch (e) {
        console.error('Chat API error:', e);
        const errText = 'Lỗi backend: ' + (e.message || 'Không thể kết nối');
        setMsgs(prev => prev.map(m => m.id === aiId ? { ...m, text: { vi: errText, en: errText }, streaming: false } : m));
        setStreaming(false);
      }
    } else {
      // Fallback: generate context-aware mock reply from session data
      reply = generateContextReply(detectedKind, session, ctx.lang);
      const full = reply.text[ctx.lang] || reply.text.vi || '';
      let idx = 0;
      const step = () => {
        idx += Math.max(2, Math.floor(Math.random() * 5) + 2);
        const chunk = full.slice(0, idx);
        setMsgs(prev => prev.map(m => m.id === aiId ? { ...m, text: { vi: chunk, en: chunk } } : m));
        if (idx < full.length) setTimeout(step, 16 + Math.random() * 24);
        else { setMsgs(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m)); setStreaming(false); }
      };
      setTimeout(step, 220);
    }
  };

  const onChip = (chip) => {
    const kindMap = { arch: 'explain', login: 'locate', malware: 'audit', compare: 'compare', cache: 'locate' };
    send(chip.label[ctx.lang], kindMap[chip.id] || 'explain');
  };

  const clearChat = () => {
    setMsgs([]);
    try { localStorage.removeItem('chat:' + sid); } catch {}
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3.5 py-3 border-b border-ink-700">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 inline-flex items-center justify-center">
            <Icon name="sparkles" size={13} className="text-teal-400"/>
          </div>
          <div className="flex-1">
            <div className="text-ink-50 font-medium text-[13px] leading-tight">{t.common.assistant}</div>
            <div className="text-ink-300 text-[11px]">
              {isReal(sid, isMock) ? 'Gemini AI · Context-aware' : ctx.mode === 'cloud' ? 'Cloud' : 'Local'}
            </div>
          </div>
          <Tooltip text={ctx.lang === 'vi' ? 'Xóa lịch sử' : 'Clear history'}>
            <Button size="iconSm" variant="ghost" onClick={clearChat}><Icon name="trash" size={12}/></Button>
          </Tooltip>
          <Tooltip text={ctx.lang === 'vi' ? 'Lịch sử' : 'History'}>
            <Button size="iconSm" variant="ghost"><Icon name="clock" size={12}/></Button>
          </Tooltip>
        </div>
        <PipelineBadge stage={stage}/>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {msgs.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/30 mx-auto inline-flex items-center justify-center">
              <Icon name="sparkles" size={20} className="text-teal-400"/>
            </div>
            <div className="text-ink-200 text-[13.5px] font-medium">{t.chat.noMessages}</div>
            <div className="text-ink-400 text-[12px] max-w-xs mx-auto leading-relaxed">
              {ctx.lang === 'vi' 
                ? 'Hỏi tôi bất cứ điều gì về codebase: kiến trúc, bảo mật, tìm file, đề xuất cải thiện...' 
                : 'Ask me anything about the codebase: architecture, security, find files, suggest improvements...'}
            </div>
          </div>
        )}
        {msgs.map(m => <Message key={m.id} m={m} onOpenFile={onOpenFile}/>)}
        {streaming && (
          <div className="flex items-center gap-2 text-ink-300 text-[12px] pl-1">
            <Spinner size={11} className="text-teal-400"/><span>{t.chat.thinking}</span>
          </div>
        )}
      </div>

      <div className="px-3 pb-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1.5">
          {DATA.QUICK_CHIPS.map(c => (
            <button key={c.id} onClick={() => onChip(c)}
              className="chip flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border border-ink-600 bg-ink-800 text-ink-200 text-[12px] hover:bg-ink-700">
              <Icon name={c.icon} size={11}/>{c.label[ctx.lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-ink-300">{t.common.context}:</span>
          <select value={contextScope} onChange={e => setContextScope(e.target.value)} className="text-[12px] py-1 h-7">
            <option value="repo">{t.chat.ctxRepo}</option>
            <option value="compare">{t.chat.ctxCompare}</option>
          </select>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-end gap-2 p-2 rounded-xl bg-ink-800 border border-ink-700 focus-within:border-teal-500/60">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1} placeholder={t.chat.placeholder}
            className="flex-1 bg-transparent border-0 outline-none text-[13.5px] text-ink-50 placeholder:text-ink-300 resize-none max-h-32 py-1"/>
          <Button size="iconSm" variant="primary" type="submit" disabled={!input.trim() || streaming}>
            <Icon name="send" size={12}/>
          </Button>
        </form>
      </div>
    </div>
  );
}

function isReal(sid, isMock) {
  return !isMock;
}

function PipelineBadge({ stage }) {
  const ctx = useApp();
  const stages = DATA.PIPELINE_STAGES;
  const idx = stages.findIndex(s => s.id === stage);
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
      {stages.map((s, i) => {
        const done = i < idx, active = i === idx && stage !== 'ready', isReady = stage === 'ready';
        const lit = done || isReady;
        return (
          <span key={s.id} className={cx(
            'inline-flex items-center gap-1 px-1.5 h-5 rounded border transition-all',
            lit  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300' :
            active ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' :
            'bg-ink-800 border-ink-700 text-ink-300')}>
            {lit ? <Icon name="check" size={10}/> : active ? <span className="sev-dot bg-amber-400 pulse-dot"/> : <span className="sev-dot bg-ink-400"/>}
            {s.label[ctx.lang]}
          </span>
        );
      })}
    </div>
  );
}

function Message({ m, onOpenFile }) {
  const ctx = useApp(); const t = ctx.t;
  if (m.role === 'user') return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-xl bg-teal-500/10 border border-teal-500/30 px-3 py-2 text-[13.5px] text-ink-50">
        {m.text[ctx.lang]}
      </div>
    </div>
  );
  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 mt-0.5 rounded-full bg-ink-700 border border-ink-600 inline-flex items-center justify-center flex-shrink-0">
        <Icon name="bot" size={11} className="text-teal-400"/>
      </div>
      <div className="flex-1 min-w-0">
        {m.provisional && (
          <div className="mb-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
            <Icon name="clock" size={10}/>{t.chat.provisional}
          </div>
        )}
        <div className={cx('rounded-xl px-3 py-2 text-[13.5px] leading-relaxed bg-ink-800 border border-ink-700 text-ink-100',
          m.streaming && 'stream-cursor')}>
          <RichText text={m.text[ctx.lang]}/>
        </div>
        {m.scope && <div className="mt-1 text-[11px] text-ink-300 italic">{t.chat.scope}: {typeof m.scope === 'object' ? m.scope[ctx.lang] : m.scope}</div>}
        {m.citations?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.citations.map((c, i) => (
              <button key={i}
                onClick={() => onOpenFile?.({ file: c.file, range: c.range, lang: c.file.split('.').pop() })}
                className="inline-flex items-center gap-1.5 px-2 h-6 rounded-md bg-ink-700 hover:bg-ink-600 border border-ink-600 text-[11.5px] font-mono text-ink-100">
                <Icon name="file-code" size={10} className="text-teal-400"/>
                <span>{c.file.split('/').slice(-1)[0]}</span>
                <span className="text-teal-400">:{c.range}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback: generate a context-aware reply from session data even without backend
function generateContextReply(kind, session, lang) {
  const repo = session?.repo;
  const modules = session?.modules || [];
  const security = session?.security || [];
  const arch = session?.arch || { nodes: [], edges: [] };
  const stats = session?.stats || {};
  const tours = session?.tours || [];

  switch (kind) {
    case 'explain': {
      const nodeCount = arch.nodes?.length || 0;
      const edgeCount = arch.edges?.length || 0;
      const layers = [...new Set((arch.nodes || []).map(n => n.layer))];
      const modNames = modules.slice(0, 5).map(m => `\`${m.name}\``).join(', ');
      return {
        text: {
          vi: `**Kiến trúc ${repo?.name || 'Repository'}:**\n\n` +
              `Hệ thống gồm **${nodeCount} components** với **${edgeCount} kết nối** import.\n` +
              `Các layer chính: ${layers.join(', ') || 'N/A'}.\n` +
              `Modules nổi bật: ${modNames || 'Chưa phân tích'}.\n` +
              `Tổng cộng **${(stats.loc || 0).toLocaleString()} dòng code** trong **${stats.files || 0} file**.`,
          en: `**Architecture of ${repo?.name || 'Repository'}:**\n\n` +
              `System has **${nodeCount} components** with **${edgeCount} import connections**.\n` +
              `Main layers: ${layers.join(', ') || 'N/A'}.\n` +
              `Key modules: ${modNames || 'Not analyzed'}.\n` +
              `Total **${(stats.loc || 0).toLocaleString()} LOC** across **${stats.files || 0} files**.`,
        },
        citations: arch.nodes?.slice(0, 3).map(n => ({ file: n.filePath || n.label, range: '1-50' })) || [],
        scope: null,
      };
    }

    case 'locate': {
      const nodes = arch.nodes || [];
      const sample = nodes.slice(0, 5).map(n => `\`${n.filePath || n.label}\``).join(', ');
      return {
        text: {
          vi: `Các file chính trong repository:\n${sample}\n\nTổng **${stats.files || 0} file** đã được phát hiện. Bạn có thể hỏi cụ thể hơn về một file hoặc module nào đó.`,
          en: `Key files in this repository:\n${sample}\n\nTotal **${stats.files || 0} files** detected. You can ask about specific files or modules.`,
        },
        citations: nodes.slice(0, 3).map(n => ({ file: n.filePath || n.label, range: '1-10' })),
        scope: null,
      };
    }

    case 'audit': {
      if (security.length === 0) {
        return {
          text: {
            vi: '**Kết quả kiểm tra bảo mật:** Không phát hiện vấn đề bảo mật nào trong lần quét này. Tuy nhiên, nên kiểm tra thêm các dependencies bằng `npm audit` hoặc `snyk`.',
            en: '**Security Audit Results:** No security issues found in this scan. However, consider running `npm audit` or `snyk` for deeper dependency analysis.',
          },
          citations: [],
          scope: null,
        };
      }
      const highCount = security.filter(s => s.severity === 'high').length;
      const medCount = security.filter(s => s.severity === 'medium').length;
      const details = security.slice(0, 3).map(s => `- [${(s.severity || '').toUpperCase()}] ${s.title?.vi || s.title?.en || s.rule}: \`${s.file}\``).join('\n');
      return {
        text: {
          vi: `**Kết quả kiểm tra bảo mật:**\n\nPhát hiện **${security.length} vấn đề**: ${highCount} high, ${medCount} medium.\n\n${details}\n\nXem chi tiết tại tab **Security**.`,
          en: `**Security Audit Results:**\n\nFound **${security.length} issues**: ${highCount} high, ${medCount} medium.\n\n${details}\n\nSee details in the **Security** tab.`,
        },
        citations: security.slice(0, 3).map(s => ({ file: s.file || '', range: s.line || '1' })),
        scope: null,
      };
    }

    case 'suggest': {
      return {
        text: {
          vi: `**Đề xuất cải thiện cho ${repo?.name || 'repo'}:**\n\n1. Thêm test coverage cho các module quan trọng\n2. Cấu hình CI/CD tự động\n3. Cải thiện error handling trong các API routes\n4. Thêm logging và monitoring\n5. Kiểm tra và cập nhật dependencies`,
          en: `**Improvement suggestions for ${repo?.name || 'repo'}:**\n\n1. Add test coverage for critical modules\n2. Configure automated CI/CD\n3. Improve error handling in API routes\n4. Add logging and monitoring\n5. Review and update dependencies`,
        },
        citations: [],
        scope: null,
      };
    }

    default:
      return {
        text: {
          vi: `Kiến trúc gồm ${arch.nodes?.length || '?'} thành phần. Hỏi tôi chi tiết hơn về module, bảo mật, hoặc cấu trúc cụ thể.`,
          en: `Architecture has ${arch.nodes?.length || '?'} components. Ask me for details about modules, security, or specific structures.`,
        },
        citations: [],
        scope: null,
      };
  }
}
