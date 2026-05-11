// AssistantPanel — the right column. Streaming Q&A, pipeline badge, citations,
// quick chips, context dropdown, and the "final summary" message that appears
// once the pipeline completes (with re-linked provisional answers).

function AssistantPanel({ ctx, session, stage, ready, onOpenFile }) {
  return <ChatShell ctx={ctx} session={session} stage={stage} ready={ready} onOpenFile={onOpenFile} variant="panel"/>;
}

function MobileAssistantDrawer({ ctx, session, stage, ready, onOpenFile }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 h-12 px-4 rounded-full bg-teal-500 text-ink-950 font-semibold shadow-glow"
      >
        <Icon name="bot" size={16}/>
        {ctx.t.common.assistant}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 backdrop flex flex-col" onClick={() => setOpen(false)}>
          <div className="mt-auto bg-ink-900 border-t border-ink-700 rounded-t-2xl h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 h-10 border-b border-ink-700">
              <span className="text-sm font-medium text-ink-50">{ctx.t.common.assistant}</span>
              <Button size="iconSm" variant="ghost" onClick={() => setOpen(false)}><Icon name="x" size={14}/></Button>
            </div>
            <ChatShell ctx={ctx} session={session} stage={stage} ready={ready} onOpenFile={(f) => { onOpenFile(f); setOpen(false); }} variant="drawer"/>
          </div>
        </div>
      )}
    </>
  );
}

// ----- Persisted transcript -----
function loadTranscript(sid, seed) {
  try {
    const raw = localStorage.getItem('chat:' + sid);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return seed.map((m, i) => ({ ...m, id: 'seed-' + i }));
}
function saveTranscript(sid, msgs) {
  try { localStorage.setItem('chat:' + sid, JSON.stringify(msgs)); } catch (e) {}
}

function ChatShell({ ctx, session, stage, ready, onOpenFile }) {
  const t = ctx.t;
  const sid = session.id;
  const isLive = sid === 'sess-acme-orders';
  const isMock = isLive || sid === 'sess-vercel-next';
  const seed = !isMock ? [] : (isLive ? window.DATA.CHAT_SEED_LIVE : window.DATA.CHAT_SEED_DONE);

  const [msgs, setMsgs] = React.useState(() => loadTranscript(sid, seed));
  const [input, setInput] = React.useState('');
  const [contextScope, setContextScope] = React.useState('repo'); // 'repo' | 'compare'
  const [streaming, setStreaming] = React.useState(false);
  const inputRef = React.useRef(null);
  const scrollRef = React.useRef(null);
  const finalAddedRef = React.useRef(false);

  React.useEffect(() => { saveTranscript(sid, msgs); }, [msgs, sid]);

  // Listen for global ⌘/ to focus
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-scroll on new messages
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs.length, streaming]);

  // When pipeline completes, append final summary + upgraded answers to provisional ones
  React.useEffect(() => {
    if (!ready || finalAddedRef.current) return;
    if (!msgs.some(m => m.provisional)) return; // only if there were provisional
    finalAddedRef.current = true;

    // Build upgrades by finding provisional ai responses
    const upgrades = msgs
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.role === 'ai' && m.provisional)
      .map(({ m, i }) => {
        const userQ = msgs[i - 1];
        return {
          question: userQ?.text || { vi: 'Câu hỏi', en: 'Question' },
          provisional: m.text,
          upgraded: upgradeAnswer(userQ?.kind, ctx.lang),
        };
      });

    setTimeout(() => {
      setMsgs(prev => [
        ...prev,
        {
          id: 'final-' + Date.now(),
          role: 'ai',
          finalSummary: true,
          upgrades,
          analysis: ctx.lang === 'vi'
            ? 'Pipeline đã hoàn tất. Cấu trúc: Express + Prisma. Cần cải thiện caching cho `/orders/list`. Phát hiện 3 finding bảo mật (1 high, 2 medium). Đã đánh chỉ mục 612 file, 84.210 dòng code.'
            : 'Pipeline complete. Structure: Express + Prisma. `/orders/list` needs caching. 3 security findings (1 high, 2 medium). Indexed 612 files, 84,210 LOC.',
          t: 999,
        },
      ]);
    }, 600);
  }, [ready, msgs, ctx.lang]);

  // Provisional clear of "provisional" flag once pipeline reaches Ready (visual hint only — answers stay)
  // (We keep the flag so the final summary can reference them.)

  const send = async (text, kind = 'explain') => {
    if (!text.trim()) return;
    const userMsg = { id: 'u-' + Date.now(), role: 'user', kind, text: { vi: text, en: text }, t: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    // If this is a real backend session, ask the API; otherwise use canned reply.
    const isRealSession = sid !== 'sess-vercel-next' && sid !== 'sess-acme-orders';
    let reply;
    if (isRealSession && await window.API.probe()) {
      try {
        const cfg = window.loadLlmCfg();
        const j = await window.API.chat({
          sessionId: sid, question: text, kind, contextScope,
          provider: cfg.provider, apiKey: cfg.apiKey, model: cfg.model,
        });
        reply = { text: j.answer, citations: j.citations || [], scope: j.scope };
      } catch (e) {
        reply = { text: { vi: 'Lỗi kết nối backend.', en: 'Backend error.' }, citations: [], scope: null };
      }
    } else {
      reply = pickReply(kind, contextScope, ready, ctx.lang);
    }

    const aiId = 'a-' + Date.now();
    setMsgs(prev => [...prev, { id: aiId, role: 'ai', text: { vi: '', en: '' }, citations: reply.citations, provisional: !ready, scope: !ready ? reply.scope : null, streaming: true, t: Date.now() }]);

    // Stream char by char
    const full = reply.text[ctx.lang] || reply.text.vi || '';
    let idx = 0;
    const step = () => {
      idx += Math.max(2, Math.floor(Math.random() * 5) + 2);
      const chunk = full.slice(0, idx);
      setMsgs(prev => prev.map(m => m.id === aiId ? { ...m, text: { vi: chunk, en: chunk } } : m));
      if (idx < full.length) setTimeout(step, 16 + Math.random() * 24);
      else {
        setMsgs(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m));
        setStreaming(false);
      }
    };
    setTimeout(step, 220);
  };

  const onChip = (chip) => {
    const text = chip.label[ctx.lang];
    const kindMap = { arch: 'explain', login: 'locate', malware: 'audit', compare: 'compare', cache: 'locate' };
    send(text, kindMap[chip.id] || 'explain');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with pipeline badge */}
      <div className="px-3.5 py-3 border-b border-ink-700 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 inline-flex items-center justify-center">
            <Icon name="sparkles" size={13} className="text-teal-400"/>
          </div>
          <div className="flex-1">
            <div className="text-ink-50 font-medium text-[13px] leading-tight">{t.common.assistant}</div>
            <div className="text-ink-300 text-[11px]">Claude Sonnet · {ctx.mode === 'cloud' ? 'Cloud' : 'Local'}</div>
          </div>
          <Tooltip text={ctx.lang === 'vi' ? 'Lịch sử' : 'History'}><Button size="iconSm" variant="ghost"><Icon name="clock" size={12}/></Button></Tooltip>
        </div>
        <PipelineBadge ctx={ctx} stage={stage}/>
      </div>

      {/* Scrollable transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {msgs.length === 0 && (
          <div className="text-center text-ink-300 text-[13px] py-12">{t.chat.noMessages}</div>
        )}
        {msgs.map((m, i) => (
          <Message key={m.id} m={m} ctx={ctx} onOpenFile={onOpenFile}/>
        ))}
        {streaming && (
          <div className="flex items-center gap-2 text-ink-300 text-[12px] pl-1">
            <Spinner size={11} className="text-teal-400"/>
            <span>{t.chat.thinking}</span>
          </div>
        )}
      </div>

      {/* Quick chips */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1.5">
          {window.DATA.QUICK_CHIPS.map(c => (
            <button
              key={c.id}
              onClick={() => onChip(c)}
              className="chip flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border border-ink-600 bg-ink-800 text-ink-200 text-[12px] hover:bg-ink-700"
            >
              <Icon name={c.icon} size={11}/>{c.label[ctx.lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-ink-300">{t.common.context}:</span>
          <select value={contextScope} onChange={e => setContextScope(e.target.value)} className="text-[12px] py-1 h-7">
            <option value="repo">{t.chat.ctxRepo}</option>
            <option value="compare">{t.chat.ctxCompare}</option>
          </select>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 p-2 rounded-xl bg-ink-800 border border-ink-700 focus-within:border-teal-500/60">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1}
            placeholder={t.chat.placeholder}
            className="flex-1 bg-transparent outline-none text-[13.5px] text-ink-50 placeholder:text-ink-300 resize-none max-h-32 py-1"
          />
          <Button size="iconSm" variant="primary" type="submit" disabled={!input.trim() || streaming}>
            <Icon name="send" size={12}/>
          </Button>
        </form>
      </div>
    </div>
  );
}

function PipelineBadge({ ctx, stage }) {
  const stages = window.DATA.PIPELINE_STAGES;
  const idx = stages.findIndex(s => s.id === stage);
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
      {stages.map((s, i) => {
        const done = i < idx;
        const active = i === idx && stage !== 'ready';
        const isReady = stage === 'ready';
        const lit = done || isReady;
        return (
          <React.Fragment key={s.id}>
            <span className={cx(
              'inline-flex items-center gap-1 px-1.5 h-5 rounded border transition-all',
              lit  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300' :
              active ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' :
              'bg-ink-800 border-ink-700 text-ink-300'
            )}>
              {lit ? <Icon name="check" size={10}/> : active ? <span className="sev-dot bg-amber-400 pulse-dot"/> : <span className="sev-dot bg-ink-400"/>}
              {s.label[ctx.lang]}
            </span>
            {i < stages.length - 1 && <span className="text-ink-500 select-none">·</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ----- Message rendering -----
function Message({ m, ctx, onOpenFile }) {
  const t = ctx.t;
  if (m.finalSummary) return <FinalSummary m={m} ctx={ctx} onOpenFile={onOpenFile}/>;

  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl bg-teal-500/10 border border-teal-500/30 px-3 py-2 text-[13.5px] text-ink-50">
          {m.text[ctx.lang]}
        </div>
      </div>
    );
  }
  // AI
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
        <div className={cx(
          'rounded-xl px-3 py-2 text-[13.5px] leading-relaxed bg-ink-800 border border-ink-700 text-ink-100',
          m.streaming && 'stream-cursor'
        )}>
          <RichText text={m.text[ctx.lang]}/>
        </div>
        {m.scope && (
          <div className="mt-1 text-[11px] text-ink-300 italic">
            {t.chat.scope}: {m.scope[ctx.lang]}
          </div>
        )}
        {m.citations && m.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.citations.map((c, i) => (
              <button key={i} onClick={() => onOpenFile && onOpenFile({ file: c.file, range: c.range, lang: c.file.split('.').pop() })}
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

function FinalSummary({ m, ctx, onOpenFile }) {
  const t = ctx.t;
  const [openA, setOpenA] = React.useState(true);
  const [openB, setOpenB] = React.useState(true);
  return (
    <div className="rounded-xl border border-teal-500/40 bg-gradient-to-br from-teal-500/10 to-blue-500/5 p-3 fade-in">
      <div className="flex items-start gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 inline-flex items-center justify-center flex-shrink-0">
          <Icon name="sparkles" size={13} className="text-teal-300"/>
        </div>
        <div className="flex-1">
          <div className="text-ink-50 font-semibold text-[14px]">{t.chat.finalSummary}</div>
          <div className="text-ink-200 text-[12px] mt-0.5">{t.chat.finalSubtitle}</div>
        </div>
      </div>

      {/* Accordion 1: full analysis */}
      <div className="rounded-lg border border-ink-700 bg-ink-900/60 overflow-hidden mb-2">
        <button onClick={() => setOpenA(o => !o)} className="w-full flex items-center justify-between px-3 h-9 text-[12.5px] text-ink-50 font-medium">
          <span className="inline-flex items-center gap-1.5"><Icon name="file-text" size={12} className="text-teal-400"/>{t.chat.fullAnalysis}</span>
          <Icon name="chevron-down" size={12} className={cx('text-ink-300 transition-transform', !openA && '-rotate-90')}/>
        </button>
        {openA && (
          <div className="px-3 pb-3 text-[13px] text-ink-100 leading-relaxed">{m.analysis}</div>
        )}
      </div>

      {/* Accordion 2: upgraded answers */}
      <div className="rounded-lg border border-ink-700 bg-ink-900/60 overflow-hidden">
        <button onClick={() => setOpenB(o => !o)} className="w-full flex items-center justify-between px-3 h-9 text-[12.5px] text-ink-50 font-medium">
          <span className="inline-flex items-center gap-1.5"><Icon name="git-merge" size={12} className="text-teal-400"/>{t.chat.contextLink}</span>
          <Icon name="chevron-down" size={12} className={cx('text-ink-300 transition-transform', !openB && '-rotate-90')}/>
        </button>
        {openB && (
          <div className="px-3 pb-3 space-y-3">
            {m.upgrades.map((u, i) => (
              <div key={i} className="border-t border-ink-700/60 pt-2 first:border-t-0 first:pt-0">
                <div className="text-[12.5px] text-ink-50 font-medium mb-1.5">{u.question[ctx.lang]}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
                    <div className="text-[10.5px] uppercase tracking-wider text-amber-300 mb-1 inline-flex items-center gap-1">
                      <Icon name="clock" size={10}/>{t.chat.provisionalAnswer}
                    </div>
                    <div className="text-[12.5px] text-ink-200 leading-relaxed">
                      <RichText text={u.provisional[ctx.lang]}/>
                    </div>
                  </div>
                  <div className="rounded-md border border-teal-500/30 bg-teal-500/5 p-2">
                    <div className="text-[10.5px] uppercase tracking-wider text-teal-300 mb-1 inline-flex items-center gap-1">
                      <Icon name="check-circle" size={10}/>{t.chat.upgradedAnswer}
                    </div>
                    <div className="text-[12.5px] text-ink-100 leading-relaxed">
                      <RichText text={u.upgraded[ctx.lang]}/>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Inline rich text for chat: backticks → code, **bold**
function RichText({ text }) {
  if (!text) return null;
  const html = text
    .replace(/`([^`]+)`/g, '<code class="font-mono text-[12px] bg-ink-700 border border-ink-600 px-1 py-px rounded text-teal-300">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-ink-50 font-semibold">$1</strong>');
  return <span dangerouslySetInnerHTML={{ __html: html }}/>;
}

// Pick a canned reply by question kind & scope
function pickReply(kind, scope, ready, lang) {
  const map = {
    locate: {
      text: {
        vi: 'Tôi tìm thấy `apps/web/auth/login.tsx` (route đăng nhập) và `apps/web/auth/callback.ts` (handler OAuth callback). Logic chính: validate state, exchange code, set session cookie.',
        en: 'I found `apps/web/auth/login.tsx` (login route) and `apps/web/auth/callback.ts` (OAuth callback). Main logic: validate state, exchange code, set session cookie.',
      },
      citations: [{ file: 'apps/web/auth/login.tsx', range: '1-214' }, { file: 'apps/web/auth/callback.ts', range: '1-96' }],
      scope: { vi: 'Cây thư mục, chưa có embedding', en: 'File tree only, embeddings not ready' },
    },
    explain: {
      text: {
        vi: 'Kiến trúc gồm 3 lớp: **Frontend** (App Router + RSC), **Backend** (`next-server` xử lý request, hỗ trợ Edge & Node), **Build** (Turbopack viết bằng Rust). Cache tiered (memory + FS, tag-based).',
        en: 'Three layers: **Frontend** (App Router + RSC), **Backend** (`next-server` handles requests on Edge & Node), **Build** (Turbopack in Rust). Tiered cache (memory + FS, tag-based).',
      },
      citations: [{ file: 'packages/next/src/server/next-server.ts', range: '1-200' }],
      scope: { vi: 'Đã có cây thư mục + framework', en: 'File tree + detected frameworks only' },
    },
    audit: {
      text: {
        vi: '6 finding tổng cộng: **2 high đã xác nhận** (eval động ở `render.tsx:482`, exfiltration env ở `telemetry.ts:128`), 1 medium (base64 obfuscation), 1 medium chưa xác nhận, 2 low là false-positive.',
        en: '6 findings total: **2 high confirmed** (dynamic eval at `render.tsx:482`, env exfiltration at `telemetry.ts:128`), 1 medium (base64 obfuscation), 1 medium pending, 2 low false-positive.',
      },
      citations: [{ file: 'packages/next/src/server/render.tsx', range: '482-489' }, { file: 'packages/next/src/build/telemetry.ts', range: '128-134' }],
      scope: { vi: 'Heuristic AST đã chạy, LLM xác nhận đang chờ', en: 'AST heuristics done, LLM confirmation pending' },
    },
    suggest: {
      text: {
        vi: 'Đề xuất: (1) thêm bloom filter trước FS lookup; (2) gỡ `event-stream` cũ; (3) bọc `new Function` bằng sandbox.',
        en: 'Suggestions: (1) add a bloom filter in front of the FS lookup; (2) drop the old `event-stream`; (3) sandbox `new Function`.',
      },
      citations: [],
      scope: { vi: 'Module cache đã được index', en: 'Cache module indexed' },
    },
    compare: {
      text: {
        vi: 'So với `acme/orders-api`: cả hai dùng `zod`. Pattern cache tiered có thể áp dụng cho endpoint `/orders/list` của bạn — endpoint đó đang gọi DB mỗi request.',
        en: 'Versus `acme/orders-api`: both use `zod`. The tiered cache pattern fits your `/orders/list` endpoint — it currently hits DB every request.',
      },
      citations: [{ file: 'packages/next/src/server/cache-fs/index.ts', range: '87-156' }],
      scope: { vi: 'Đã có embedding cả 2 repo', en: 'Both repos embedded' },
    },
  };
  return map[kind] || map.explain;
}

function upgradeAnswer(kind, lang) {
  const t = {
    locate: {
      vi: 'Đã xác nhận: `apps/web/auth/login.tsx:1-214` cùng middleware `apps/web/middleware.ts:1-48` (rate-limit + redirect chưa-auth). Provider đang dùng: GitHub OAuth, callback ở `callback.ts:14-96`.',
      en: 'Confirmed: `apps/web/auth/login.tsx:1-214` and middleware `apps/web/middleware.ts:1-48` (rate-limit + unauth redirect). Provider in use: GitHub OAuth; callback in `callback.ts:14-96`.',
    },
    audit: {
      vi: '6 finding xác nhận: 2 **high** (eval động `render.tsx:482-489`, exfiltration env `telemetry.ts:128-134`), 1 **medium** (obfuscation `_internal.ts:12`). Patch đề xuất đã được sinh ở tab Security.',
      en: '6 findings confirmed: 2 **high** (dynamic eval `render.tsx:482-489`, env exfiltration `telemetry.ts:128-134`), 1 **medium** (obfuscation `_internal.ts:12`). Suggested patches generated in the Security tab.',
    },
    explain: {
      vi: 'Sơ đồ block đầy đủ ở tab Architecture. Pipeline render: Edge → next-server → cache-fs → DB → render → Browser. Streaming HTML có sẵn, ISR theo tag.',
      en: 'Full block diagram in the Architecture tab. Render pipeline: Edge → next-server → cache-fs → DB → render → Browser. Streaming HTML, tag-based ISR.',
    },
  };
  return { vi: t[kind]?.vi || t.explain.vi, en: t[kind]?.en || t.explain.en };
}

window.AssistantPanel = AssistantPanel;
window.MobileAssistantDrawer = MobileAssistantDrawer;
