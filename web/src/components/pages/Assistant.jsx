'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/src/context/AppContext';
import Icon from '@/src/components/Icon';
import { Button, Tooltip, Spinner, RichText } from '@/src/components/ui';
import API, { loadLlmCfg } from '@/src/lib/api';
import DATA from '@/src/lib/data';
import cx from '@/src/lib/cx';

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

  const send = async (text, kind = 'explain') => {
    if (!text.trim()) return;
    const userMsg = { id: 'u-' + Date.now(), role: 'user', kind, text: { vi: text, en: text }, t: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    setInput(''); setStreaming(true);

    const isReal = !isMock;
    let reply;
    if (isReal && await API.probe()) {
      try {
        const cfg = loadLlmCfg();
        const j = await API.chat({
          sessionId: sid, question: text, kind, contextScope,
          provider: cfg.provider, apiKey: cfg.apiKey, model: cfg.model,
        });
        reply = { text: j.answer, citations: j.citations || [], scope: j.scope };
      } catch (e) {
        reply = { text: { vi: 'Lỗi backend.', en: 'Backend error.' }, citations: [], scope: null };
      }
    } else {
      reply = pickReply(kind, ctx.lang);
    }

    const aiId = 'a-' + Date.now();
    setMsgs(prev => [...prev, { id: aiId, role: 'ai', text: { vi: '', en: '' },
      citations: reply.citations, provisional: !ready, scope: !ready ? reply.scope : null,
      streaming: true, t: Date.now() }]);

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
  };

  const onChip = (chip) => {
    const kindMap = { arch: 'explain', login: 'locate', malware: 'audit', compare: 'compare', cache: 'locate' };
    send(chip.label[ctx.lang], kindMap[chip.id] || 'explain');
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
            <div className="text-ink-300 text-[11px]">{ctx.mode === 'cloud' ? 'Cloud' : 'Local'}</div>
          </div>
          <Tooltip text={ctx.lang === 'vi' ? 'Lịch sử' : 'History'}>
            <Button size="iconSm" variant="ghost"><Icon name="clock" size={12}/></Button>
          </Tooltip>
        </div>
        <PipelineBadge stage={stage}/>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {msgs.length === 0 && <div className="text-center text-ink-300 text-[13px] py-12">{t.chat.noMessages}</div>}
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
        {m.scope && <div className="mt-1 text-[11px] text-ink-300 italic">{t.chat.scope}: {m.scope[ctx.lang]}</div>}
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

function pickReply(kind, lang) {
  const map = {
    locate:  { vi: 'Tôi tìm thấy `apps/web/auth/login.tsx` và `callback.ts`.', en: 'I found `apps/web/auth/login.tsx` and `callback.ts`.' },
    explain: { vi: 'Kiến trúc gồm Frontend, Backend (`next-server`), Build (Turbopack).', en: 'Three layers: Frontend, Backend (`next-server`), Build (Turbopack).' },
    audit:   { vi: '6 finding tổng cộng: 2 high đã xác nhận.', en: '6 findings total: 2 high confirmed.' },
    suggest: { vi: 'Đề xuất: bloom filter, gỡ event-stream, sandbox new Function.', en: 'Suggestions: bloom filter, drop event-stream, sandbox new Function.' },
    compare: { vi: 'Pattern cache tiered có thể áp dụng cho `/orders/list`.', en: 'Tiered cache pattern fits your `/orders/list`.' },
  };
  const r = map[kind] || map.explain;
  return { text: r, citations: [], scope: null };
}
