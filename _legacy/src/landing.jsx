// Landing page (/) — hero with URL input, feature cards, demo gallery, cloud/local toggle.
function LandingPage({ ctx }) {
  const t = ctx.t;
  const [url, setUrl] = React.useState('');
  const [mode, setMode] = React.useState(ctx.mode);
  const [shake, setShake] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const [busy, setBusy] = React.useState(false);

  const handleAnalyze = async (e) => {
    e?.preventDefault?.();
    const trimmed = url.trim();
    const ok = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/i.test(trimmed)
            || /^[\w.-]+\/[\w.-]+$/.test(trimmed); // owner/repo short form
    if (!ok) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setBusy(true);
    const live = await window.API.probe();
    if (live) {
      try {
        const s = await window.API.startScan(trimmed);
        ctx.navigate('/scan/' + s.id);
        return;
      } catch (err) {
        console.error('startScan failed', err);
        // fall through to mock
      } finally {
        setBusy(false);
      }
    }
    setBusy(false);
    ctx.navigate('/scan/sess-acme-orders'); // mock fallback
  };

  const demos = [
    { id: 'sess-vercel-next', name: 'vercel/next.js',  blurb: { vi: 'Framework React full-stack',     en: 'Full-stack React framework' }, langs: ['ts','rs','tsx'] },
    { id: 'sess-shadcn-ui',   name: 'shadcn-ui/ui',    blurb: { vi: 'UI kit dùng Radix + Tailwind',    en: 'UI kit on Radix + Tailwind' },  langs: ['tsx'] },
    { id: 'sess-prisma',      name: 'prisma/prisma',   blurb: { vi: 'ORM hiện đại cho TS/Node',         en: 'Modern ORM for TS/Node' },      langs: ['ts','rs'] },
  ];

  const features = [
    { key: 'arch',    icon: 'network',      tone: 'teal' },
    { key: 'qa',      icon: 'message-square', tone: 'blue' },
    { key: 'malware', icon: 'shield-alert', tone: 'red' },
    { key: 'compare', icon: 'swap',         tone: 'purple' },
  ];

  return (
    <div className="min-h-full bg-grid bg-radial-spot">
      {/* Hero */}
      <section className="px-6 pt-20 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-ink-700 bg-ink-800/60 backdrop-blur text-[12px] text-ink-200 fade-in">
            <span className="sev-dot bg-teal-500 pulse-dot"></span>
            <span>{ctx.lang === 'vi' ? 'Phiên bản beta — đang index 487 repo công khai' : 'Beta — currently indexing 487 public repos'}</span>
          </div>
          <h1 className="text-[56px] leading-[1.05] font-semibold tracking-tight text-ink-50 mb-5 fade-in" style={{ textWrap: 'balance' }}>
            {t.tagline}
          </h1>
          <p className="text-ink-200 text-lg max-w-2xl mx-auto mb-10 fade-in" style={{ textWrap: 'pretty' }}>
            {t.subtitle}
          </p>

          {/* URL Input */}
          <form onSubmit={handleAnalyze} className={cx('mx-auto max-w-2xl', shake && 'animate-pulse')}>
            <div className={cx(
              'flex items-stretch gap-2 p-2 rounded-2xl bg-ink-800/80 border backdrop-blur transition-all fade-in',
              shake ? 'border-red-500/60' : 'border-ink-700 hover:border-ink-600 focus-within:border-teal-500/60 focus-within:shadow-glow',
            )}>
              <div className="flex items-center pl-3 text-ink-300">
                <Icon name="github" size={18} />
              </div>
              <input
                ref={inputRef}
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={t.pasteRepo}
                className="flex-1 bg-transparent outline-none text-ink-50 placeholder:text-ink-300 text-[15px] py-2"
                aria-label="GitHub URL"
              />
              <Button variant="primary" size="lg" type="submit" disabled={busy}>
                {busy ? <Spinner size={14}/> : <Icon name="sparkles" size={16} />}
                <span>{busy ? (ctx.lang === 'vi' ? 'Đang gửi…' : 'Submitting…') : t.analyze}</span>
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3 text-[12.5px] text-ink-300">
              <span>{ctx.lang === 'vi' ? 'Hoặc thử nhanh:' : 'Or try:'}</span>
              {['vercel/next.js', 'shadcn-ui/ui', 'prisma/prisma'].map(d => (
                <button key={d} onClick={() => setUrl('https://github.com/' + d)} className="px-2 py-1 rounded-md border border-ink-700 hover:border-ink-500 hover:text-ink-100 transition-colors font-mono">
                  {d}
                </button>
              ))}
            </div>
          </form>

          {/* Mode toggle */}
          <div className="mt-10 inline-flex items-center gap-3 fade-in">
            <ModeToggle value={mode} onChange={(v) => { setMode(v); ctx.setMode(v); }} t={t} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <Card key={f.key} className="p-5 hover:border-ink-500 transition-colors group">
              <div className={cx(
                'inline-flex w-9 h-9 items-center justify-center rounded-lg mb-3 border',
                f.tone === 'teal'   && 'bg-teal-500/10  text-teal-400  border-teal-500/30',
                f.tone === 'blue'   && 'bg-blue-500/10  text-blue-300  border-blue-500/30',
                f.tone === 'red'    && 'bg-red-500/10   text-red-300   border-red-500/30',
                f.tone === 'purple' && 'bg-violet-500/10 text-violet-300 border-violet-500/30',
              )}>
                <Icon name={f.icon} size={18} />
              </div>
              <h3 className="text-ink-50 font-semibold mb-1.5">{t.feat[f.key].title}</h3>
              <p className="text-ink-200 text-[13.5px] leading-relaxed">{t.feat[f.key].desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Demo gallery */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-ink-50 text-2xl font-semibold tracking-tight">{t.demo.title}</h2>
            <button onClick={() => ctx.navigate('/library')} className="text-teal-400 hover:text-teal-300 text-sm flex items-center gap-1 link-arrow">
              {t.nav.library} <Icon name="arrow-up-right" size={14} className="arr"/>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demos.map(d => (
              <Card key={d.id} className="p-5 hover:border-teal-500/40 hover:shadow-glow transition-all cursor-pointer group" onClick={() => ctx.navigate('/scan/' + d.id)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon name="github" size={18} className="text-ink-200"/>
                    <span className="font-mono text-ink-50 font-medium">{d.name}</span>
                  </div>
                  <Badge tone="teal"><Icon name="check-circle" size={10}/>indexed</Badge>
                </div>
                <p className="text-ink-200 text-[13.5px] mb-4">{d.blurb[ctx.lang]}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">{d.langs.map(l => <LangIcon key={l} lang={l} size={16} />)}</div>
                  <span className="text-teal-400 text-sm flex items-center gap-1 link-arrow">
                    {t.demo.cta} <Icon name="arrow-right" size={13} className="arr"/>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works strip */}
      <section className="border-t border-ink-700 bg-ink-900/40">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { n: '01', icon: 'git-branch', title: { vi: 'Clone & parse', en: 'Clone & parse' }, desc: { vi: 'AST chuẩn cho mọi ngôn ngữ', en: 'Universal AST for every language' } },
            { n: '02', icon: 'database',   title: { vi: 'Index vector', en: 'Vector index' },   desc: { vi: 'RAG có ngữ cảnh hội thoại',   en: 'Conversation-aware RAG' } },
            { n: '03', icon: 'bot',        title: { vi: 'Hỏi đáp song song', en: 'Parallel Q&A' }, desc: { vi: 'Trả lời tạm khi đang quét', en: 'Provisional answers while scanning' } },
            { n: '04', icon: 'file-text',  title: { vi: 'Tổng hợp cuối phiên', en: 'Final summary' }, desc: { vi: 'Báo cáo nâng cấp, mở PR', en: 'Upgraded report, opens a PR' } },
          ].map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="font-mono text-teal-400 text-sm pt-1">{s.n}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={s.icon} size={14} className="text-ink-200"/>
                  <h4 className="text-ink-50 font-medium text-sm">{s.title[ctx.lang]}</h4>
                </div>
                <p className="text-ink-300 text-[12.5px]">{s.desc[ctx.lang]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ModeToggle({ value, onChange, t }) {
  return (
    <div className="inline-flex items-center bg-ink-800 border border-ink-700 rounded-full p-1">
      <button
        onClick={() => onChange('cloud')}
        className={cx('inline-flex items-center gap-2 h-8 px-4 rounded-full text-sm font-medium transition-all',
          value === 'cloud' ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'text-ink-200 hover:text-ink-50 border border-transparent')}>
        <Icon name="cloud" size={14} /><span>{t.cloud}</span>
      </button>
      <button
        onClick={() => onChange('local')}
        className={cx('inline-flex items-center gap-2 h-8 px-4 rounded-full text-sm font-medium transition-all',
          value === 'local' ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30' : 'text-ink-200 hover:text-ink-50 border border-transparent')}>
        <Icon name="server" size={14} /><span>{t.local}</span>
      </button>
    </div>
  );
}

window.LandingPage = LandingPage;
window.ModeToggle = ModeToggle;
