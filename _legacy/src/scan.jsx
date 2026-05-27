// Scan page (/scan/:sessionId) — the core 3-column workspace.
// Composes: ProjectTree (left), Workspace tabs (middle), AssistantPanel (right).
// Drives the simulated pipeline progression and progressive Q&A.

const STAGE_DURATIONS = {
  cloning: 2400,
  parsing: 4200,
  indexing: 5400,
  summarizing: 3000,
};

function ScanPage({ ctx, params }) {
  const t = ctx.t;
  const sid = params.sessionId;
  const isMock = sid === 'sess-acme-orders' || sid === 'sess-vercel-next';
  const isLive = sid === 'sess-acme-orders';

  // Real backend session (loaded async); falls back to mock data otherwise.
  const [remote, setRemote] = React.useState(null);
  const [remoteErr, setRemoteErr] = React.useState(null);

  React.useEffect(() => {
    if (isMock) return;
    let stopped = false;
    let timer = null;
    const tick = async () => {
      try {
        const live = await window.API.probe();
        if (!live) { setRemoteErr('backend-offline'); return; }
        const raw = await window.API.getScan(sid);
        if (stopped) return;
        const adapted = window.adaptSessionForUI(raw, ctx.lang);
        setRemote(adapted);
        if (raw.status === 'ready' || raw.status === 'failed') return;
        timer = setTimeout(tick, 1500);
      } catch (err) {
        if (!stopped) setRemoteErr(String(err.message || err));
      }
    };
    tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [sid, isMock, ctx.lang]);

  const session = remote
    || (isLive ? window.DATA.SCAN_LIVE : window.DATA.SCAN_DONE);

  // Pipeline stage progression
  const [stage, setStage] = React.useState(isMock
    ? (isLive ? 'cloning' : 'ready')
    : 'cloning');

  // For mock live session — animate. For real session — follow remote.stage.
  const [stageStarted, setStageStarted] = React.useState(Date.now());

  React.useEffect(() => {
    if (!isMock) {
      if (remote && remote.stage) setStage(remote.stage);
      return;
    }
    if (!isLive || stage === 'ready') return;
    const order = ['cloning', 'parsing', 'indexing', 'summarizing', 'ready'];
    const idx = order.indexOf(stage);
    const next = order[idx + 1];
    const dur = STAGE_DURATIONS[stage] || 2000;
    const tm = setTimeout(() => {
      setStage(next);
      setStageStarted(Date.now());
    }, dur);
    return () => clearTimeout(tm);
  }, [stage, isLive, isMock, remote]);

  // Layout: column widths persisted
  const [leftW, setLeftW]   = React.useState(() => +localStorage.getItem('cw:left')  || 240);
  const [rightW, setRightW] = React.useState(() => +localStorage.getItem('cw:right') || 380);
  React.useEffect(() => { localStorage.setItem('cw:left', leftW); }, [leftW]);
  React.useEffect(() => { localStorage.setItem('cw:right', rightW); }, [rightW]);

  // Active tab
  const [tab, setTab] = React.useState('overview');
  const [openFile, setOpenFile] = React.useState(null); // {file, range}
  const [leftDrawerOpen, setLeftDrawerOpen] = React.useState(false);

  // Mobile detection
  const [isNarrow, setIsNarrow] = React.useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  React.useEffect(() => {
    const onR = () => setIsNarrow(window.innerWidth < 1024);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const stageIdx = ['cloning','parsing','indexing','summarizing','ready'].indexOf(stage);
  const treeReady = stageIdx >= 1; // tree fades in after parsing
  const dataReady = stageIdx >= 2; // overview, modules
  const archReady = stageIdx >= 3;
  const ready = stage === 'ready';

  return (
    <div className="h-full flex flex-col">
      {/* Sub-header for the scan view */}
      <div className="border-b border-ink-700 bg-ink-900/40 px-4 h-12 flex items-center gap-3 flex-shrink-0">
        {isNarrow && (
          <Button size="iconSm" variant="ghost" onClick={() => setLeftDrawerOpen(true)} aria-label="Open file tree">
            <Icon name="panel-left" size={14}/>
          </Button>
        )}
        <Icon name="github" size={15} className="text-ink-200"/>
        <span className="font-mono text-ink-50 text-[13.5px]">{session.repo.owner}/{session.repo.name}</span>
        <Badge tone="slate"><Icon name="git-branch" size={10}/>{session.repo.branch}</Badge>
        <Badge tone="slate" className="font-mono">{session.repo.commit}</Badge>
        <span className="hidden md:inline text-ink-300 text-[12.5px] truncate max-w-[40%]">{session.repo.desc[ctx.lang]}</span>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip text={ctx.lang === 'vi' ? 'Quét lại' : 'Re-scan'}>
            <Button size="iconSm" variant="ghost"><Icon name="refresh-cw" size={13}/></Button>
          </Tooltip>
          <Button size="sm" variant="outline" as="a" href={session.repo.url} target="_blank" rel="noreferrer">
            <Icon name="external-link" size={12}/> GitHub
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left: Project Tree */}
        {(!isNarrow) && (
          <>
            <div className="flex-shrink-0 border-r border-ink-700 bg-ink-900/40 overflow-y-auto" style={{ width: leftW }}>
              <ProjectTree ctx={ctx} ready={treeReady} stage={stage} session={session} onOpen={(f) => { setOpenFile(f); setTab('file'); }} />
            </div>
            <Resizer onResize={(dx) => setLeftW(w => Math.max(180, Math.min(380, w + dx)))}/>
          </>
        )}
        {isNarrow && leftDrawerOpen && (
          <div className="absolute inset-0 z-30 flex">
            <div className="w-[80%] max-w-[320px] bg-ink-900 border-r border-ink-700 overflow-y-auto">
              <div className="flex items-center justify-between px-3 h-10 border-b border-ink-700">
                <span className="text-sm font-medium text-ink-50">{t.common.tree}</span>
                <Button size="iconSm" variant="ghost" onClick={() => setLeftDrawerOpen(false)}><Icon name="x" size={14}/></Button>
              </div>
              <ProjectTree ctx={ctx} ready={treeReady} stage={stage} session={session} onOpen={(f) => { setOpenFile(f); setTab('file'); setLeftDrawerOpen(false); }} />
            </div>
            <div className="flex-1 backdrop" onClick={() => setLeftDrawerOpen(false)}/>
          </div>
        )}

        {/* Middle: Workspace */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <Workspace ctx={ctx} session={session} tab={tab} setTab={setTab} ready={ready} dataReady={dataReady} archReady={archReady} openFile={openFile} setOpenFile={setOpenFile}/>
        </div>

        {/* Right: Assistant */}
        {!isNarrow && (
          <>
            <Resizer onResize={(dx) => setRightW(w => Math.max(320, Math.min(560, w - dx)))}/>
            <div className="flex-shrink-0 border-l border-ink-700 bg-ink-900/40" style={{ width: rightW }}>
              <AssistantPanel ctx={ctx} session={session} stage={stage} ready={ready} onOpenFile={(f) => { setOpenFile(f); setTab('file'); }}/>
            </div>
          </>
        )}
      </div>

      {/* Mobile assistant: floating toggle + drawer */}
      {isNarrow && <MobileAssistantDrawer ctx={ctx} session={session} stage={stage} ready={ready} onOpenFile={(f) => { setOpenFile(f); setTab('file'); }}/>}
    </div>
  );
}

function Resizer({ onResize }) {
  const dragging = React.useRef(false);
  const lastX = React.useRef(0);
  const [drag, setDrag] = React.useState(false);
  const onDown = (e) => {
    dragging.current = true;
    lastX.current = e.clientX;
    setDrag(true);
    document.body.style.cursor = 'col-resize';
  };
  React.useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onResize(dx);
    };
    const onUp = () => {
      dragging.current = false;
      setDrag(false);
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onResize]);
  return <div className={cx('resizer', drag && 'dragging')} onMouseDown={onDown} role="separator" aria-orientation="vertical"/>;
}

// -------------------- Project Tree --------------------
function ProjectTree({ ctx, ready, stage, session, onOpen }) {
  const t = ctx.t;
  const liveTree = session && session.tree && session.tree.length ? session.tree : null;
  const treeData = liveTree || window.DATA.FILE_TREE;
  if (!ready) {
    return (
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-[11.5px] text-ink-300 uppercase tracking-wider px-1.5">
          <Spinner size={11} className="text-teal-400"/>
          <span>{ctx.lang === 'vi' ? 'Đang đọc cây thư mục…' : 'Reading file tree…'}</span>
        </div>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-1.5">
            <Skeleton className="h-3.5" style={{ width: 12 }}/>
            <Skeleton className="h-3.5" style={{ width: `${30 + (i * 7) % 50}%` }}/>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="py-2">
      <div className="px-3 mb-2 flex items-center justify-between">
        <span className="text-[11.5px] text-ink-300 uppercase tracking-wider">{t.common.tree}</span>
        <Tooltip text={t.common.search}><Button size="iconSm" variant="ghost"><Icon name="search" size={12}/></Button></Tooltip>
      </div>
      <div className="text-[13px] font-mono pb-3">
        {treeData.map((n, i) => (
          <TreeNode key={n.path || n.name + i} node={n} depth={0} onOpen={onOpen} ctx={ctx} stagger={i}/>
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, depth, onOpen, ctx, stagger = 0 }) {
  const [open, setOpen] = React.useState(node.expanded === true);
  const indent = 8 + depth * 12;
  if (node.type === 'dir') {
    return (
      <div className="tree-row" style={{ animationDelay: `${stagger * 30}ms` }}>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-1.5 hover:bg-ink-700/60 py-0.5 text-left"
          style={{ paddingLeft: indent }}
        >
          <Icon name="chevron-right" size={11} className={cx('text-ink-300 transition-transform', open && 'rotate-90')}/>
          <Icon name={open ? 'folder-open' : 'folder'} size={13} className="text-amber-400/80"/>
          <span className="text-ink-100">{node.name}</span>
        </button>
        {open && node.children?.map((c, i) => <TreeNode key={i} node={c} depth={depth + 1} onOpen={onOpen} ctx={ctx} />)}
      </div>
    );
  }
  return (
    <Tooltip text={node.role ? node.role[ctx.lang] : node.name} side="right">
      <button
        onClick={() => onOpen({ file: node.path || node.name, lang: node.lang, loc: node.loc, size: node.size })}
        className="w-full flex items-center gap-1.5 hover:bg-ink-700/60 py-0.5 text-left tree-row"
        style={{ paddingLeft: indent + 14 }}
      >
        <LangIcon lang={node.lang} size={12}/>
        <span className="text-ink-200 truncate flex-1">{node.name}</span>
        {node.loc && <span className="text-ink-300 text-[11px] mr-2">{node.loc}</span>}
      </button>
    </Tooltip>
  );
}

// -------------------- Workspace (tabs) --------------------
function Workspace({ ctx, session, tab, setTab, ready, dataReady, archReady, openFile, setOpenFile }) {
  const t = ctx.t;
  const TABS = [
    { id: 'overview',      label: t.tabs.overview,      icon: 'gauge'   },
    { id: 'architecture',  label: t.tabs.architecture,  icon: 'network' },
    { id: 'flow',          label: t.tabs.flow,          icon: 'workflow'},
    { id: 'modules',       label: t.tabs.modules,       icon: 'blocks'  },
    { id: 'security',      label: t.tabs.security,      icon: 'shield'  },
    { id: 'documentation', label: t.tabs.documentation, icon: 'book-open'},
  ];

  return (
    <>
      <div className="border-b border-ink-700 bg-ink-900/40 flex-shrink-0 px-2 flex items-end overflow-x-auto">
        {TABS.map(tt => (
          <button
            key={tt.id}
            onClick={() => setTab(tt.id)}
            className={cx(
              'relative inline-flex items-center gap-1.5 px-3 h-10 text-[13px] font-medium whitespace-nowrap transition-colors',
              tab === tt.id ? 'tab-active' : 'text-ink-200 hover:text-ink-100'
            )}
          >
            <Icon name={tt.icon} size={13}/>
            <span>{tt.label}</span>
            {tt.id === 'security' && session.id === 'sess-vercel-next' && <Badge tone="red" className="ml-1">2</Badge>}
          </button>
        ))}
        {tab === 'file' && openFile && (
          <button onClick={() => setTab('overview')} className="relative inline-flex items-center gap-1.5 px-3 h-10 text-[13px] font-medium tab-active">
            <Icon name="file-code" size={13}/>
            <span className="font-mono">{openFile.file}</span>
            <span className="ml-1 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setOpenFile(null); setTab('overview'); }}><Icon name="x" size={12}/></span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-ink-950">
        {tab === 'overview'      && <OverviewTab     ctx={ctx} session={session} ready={dataReady}/>}
        {tab === 'architecture'  && <ArchitectureTab ctx={ctx} ready={archReady} session={session}/>}
        {tab === 'flow'          && <FlowTab         ctx={ctx} ready={archReady}/>}
        {tab === 'modules'       && <ModulesTab      ctx={ctx} ready={dataReady} session={session}/>}
        {tab === 'security'      && <SecurityTab     ctx={ctx} ready={ready} session={session}/>}
        {tab === 'documentation' && <DocsTab         ctx={ctx} ready={ready} session={session}/>}
        {tab === 'file' && openFile && <FileViewer ctx={ctx} file={openFile} session={session}/>}
      </div>
    </>
  );
}

// -------------------- Tab: Overview (Enhanced) --------------------
function OverviewTab({ ctx, session, ready }) {
  const t = ctx.t;
  const [activeLang, setActiveLang] = React.useState(null);
  const [activeFw, setActiveFw] = React.useState(null);
  const [activeQACat, setActiveQACat] = React.useState(window.DATA.AI_ASSESSMENT?.categories[0]?.id || 'purpose');

  if (!ready) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24"/>)}
        </div>
        <Skeleton className="h-40"/>
        <Skeleton className="h-64"/>
      </div>
    );
  }

  // Sparkline mock data
  const sparkData = {
    loc: [820000, 940000, 1020000, 1100000, 1180000, 1230000, 1284530],
    files: [4200, 4800, 5300, 5800, 6200, 6600, 6932],
    modules: [28, 32, 35, 38, 42, 45, 47],
    contributors: [1800, 2100, 2400, 2600, 2800, 3000, 3128],
  };

  const statCard = (label, value, icon, trend, sparkline, sparkColor) => (
    <Card className="p-4 stat-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-ink-300 text-[11.5px] uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          <Sparkline data={sparkline} color={sparkColor || '#14B8A6'} width={48} height={16}/>
          <Icon name={icon} size={13} className="text-ink-300"/>
        </div>
      </div>
      <div className="font-mono text-ink-50 text-2xl tracking-tight mb-1">
        <AnimatedNumber value={value}/>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-[11px]">
          <Icon name="arrow-up-right" size={10} className="text-emerald-400"/>
          <span className="text-emerald-400">{trend}</span>
        </div>
      )}
    </Card>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* AI Intelligence Report */}
      {window.DATA.AI_ASSESSMENT && (
        <Card className="mb-5 overflow-hidden border-teal-500/30">
          <div className="bg-gradient-to-r from-teal-900/40 to-ink-900/40 p-5 border-b border-ink-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="sparkles" size={16} className="text-teal-400"/>
                  <h3 className="text-ink-50 font-medium text-[15px]">{t.ass.title}</h3>
                </div>
                <p className="text-ink-300 text-[13px]">
                  {ctx.lang === 'vi' ? 'Đánh giá chuyên sâu dựa trên lý luận AI và phân tích mã nguồn tĩnh.' : 'Deep assessment based on AI reasoning and static code analysis.'}
                </p>
              </div>
              <ConfidenceGauge score={window.DATA.AI_ASSESSMENT.confidence} />
            </div>
          </div>
          <div className="p-5 space-y-6">
            {/* Contradictions */}
            {window.DATA.AI_ASSESSMENT.contradictions.map((c, i) => (
              <ContradictionAlert key={i} item={c} t={t} lang={ctx.lang} />
            ))}

            {/* Beginner Guide (ELI5) */}
            <BeginnerGuideCard guide={window.DATA.AI_ASSESSMENT.beginnerGuide} lang={ctx.lang} repoName={session.repo.name} />

            {/* Q&A List with Tab Categories */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h4 className="text-sm font-medium text-ink-100 flex items-center gap-2">
                  <Icon name="message-square" size={14}/>
                  {ctx.lang === 'vi' ? 'Hỏi đáp chuyên sâu' : 'Deep Q&A'}
                </h4>
                
                <div className="flex items-center gap-1 bg-ink-900/50 p-1 rounded-lg border border-ink-800 overflow-x-auto hide-scrollbar">
                  {window.DATA.AI_ASSESSMENT.categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveQACat(cat.id)}
                      className={cx(
                        "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap",
                        activeQACat === cat.id ? "bg-ink-700 text-ink-50 shadow-sm" : "text-ink-300 hover:text-ink-100 hover:bg-ink-800/50"
                      )}
                    >
                      {cat.name[ctx.lang]}
                    </button>
                  ))}
                </div>
              </div>
              
              {window.DATA.AI_ASSESSMENT.categories.map(cat => (
                <div key={cat.id} style={{ display: activeQACat === cat.id ? 'block' : 'none' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.qa.map((qa, i) => (
                      <RichQACard key={i} item={qa} lang={ctx.lang} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Suitability */}
            <div className="flex flex-col md:flex-row gap-4">
              <SuitabilityCard type="good" items={window.DATA.AI_ASSESSMENT.suitability.goodFor} t={t} lang={ctx.lang} />
              <SuitabilityCard type="bad" items={window.DATA.AI_ASSESSMENT.suitability.badFor} t={t} lang={ctx.lang} />
            </div>

            {/* Metrics */}
            <div>
              <h4 className="text-sm font-medium text-ink-100 mb-3 flex items-center gap-2">
                <Icon name="activity" size={14}/>
                {t.ass.metrics}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {window.DATA.AI_ASSESSMENT.metrics.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-ink-900/30 border border-ink-800 rounded-lg transition-colors hover:border-teal-500/50 hover:bg-ink-900/50 cursor-default">
                    <div className={cx("w-8 h-8 rounded bg-ink-800 flex items-center justify-center flex-shrink-0", m.highlight === 'amber' ? 'text-amber-400' : 'text-teal-400')}>
                      <Icon name={m.icon} size={14}/>
                    </div>
                    <div>
                      <div className="text-[11px] text-ink-300 uppercase tracking-wider">{m.cat[ctx.lang]}</div>
                      <div className={cx("text-[13px] font-medium mt-0.5", m.highlight === 'amber' ? 'text-amber-400' : 'text-ink-50')}>{m.res[ctx.lang]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stat Cards with sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {statCard(t.overview.stats.loc, session.stats.loc, 'code-2', '+8.4%', sparkData.loc, '#14B8A6')}
        {statCard(t.overview.stats.files, session.stats.files, 'file', '+5.2%', sparkData.files, '#3B82F6')}
        {statCard(t.overview.stats.modules, session.stats.modules, 'blocks', '+4.4%', sparkData.modules, '#8B5CF6')}
        {statCard(t.overview.stats.contributors, session.stats.contributors, 'user', '+12%', sparkData.contributors, '#F59E0B')}
      </div>

      {/* Interactive Languages bar */}
      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-ink-50 font-medium">{t.overview.langs}</h3>
          <span className="text-ink-300 text-xs">{session.langs.length} {ctx.lang === 'vi' ? 'ngôn ngữ' : 'languages'}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-ink-700 mb-4 cursor-pointer">
          {session.langs.map(l => (
            <Tooltip key={l.name} text={`${l.name}: ${l.pct}%`}>
              <div
                onClick={() => setActiveLang(activeLang === l.name ? null : l.name)}
                className="transition-all duration-300 hover:opacity-80"
                style={{
                  width: l.pct + '%',
                  background: l.color,
                  opacity: activeLang && activeLang !== l.name ? 0.3 : 1,
                }}
              />
            </Tooltip>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {session.langs.map(l => (
            <div
              key={l.name}
              onClick={() => setActiveLang(activeLang === l.name ? null : l.name)}
              className={cx('lang-chip flex items-center gap-2 text-[12.5px]', activeLang === l.name && 'active')}
            >
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: l.color }}/>
              <span className="text-ink-100">{l.name}</span>
              <span className="text-ink-300 ml-auto font-mono">{l.pct}%</span>
            </div>
          ))}
        </div>
        {/* Detail panel when language is selected */}
        {activeLang && (() => {
          const lang = session.langs.find(l => l.name === activeLang);
          if (!lang) return null;
          const estimatedFiles = Math.round(session.stats.files * lang.pct / 100);
          const estimatedLoc = Math.round(session.stats.loc * lang.pct / 100);
          return (
            <div className="mt-4 detail-panel rounded-lg border border-ink-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-ink-900/60 border-b border-ink-700/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: lang.color }}/>
                  <span className="text-ink-50 font-medium text-[13px]">{lang.name}</span>
                  <Badge tone="teal">{lang.pct}%</Badge>
                </div>
                <button onClick={() => setActiveLang(null)} className="text-ink-300 hover:text-ink-100">
                  <Icon name="x" size={14}/>
                </button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 text-[13px]">
                <div>
                  <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-1">{ctx.lang === 'vi' ? 'Ước tính files' : 'Est. files'}</div>
                  <div className="text-ink-50 font-mono">{estimatedFiles.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-1">{ctx.lang === 'vi' ? 'Ước tính LOC' : 'Est. LOC'}</div>
                  <div className="text-ink-50 font-mono">{estimatedLoc.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-1">{ctx.lang === 'vi' ? 'Tỷ lệ' : 'Share'}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: lang.pct + '%', background: lang.color }}/>
                    </div>
                    <span className="text-ink-50 font-mono text-[12px]">{lang.pct}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Interactive Frameworks */}
      <Card className="p-5 mb-5">
        <h3 className="text-ink-50 font-medium mb-3">{t.overview.frameworks}</h3>
        <div className="flex flex-wrap gap-2">
          {session.frameworks.map(f => (
            <Tooltip key={f} text={window.DATA.FRAMEWORK_DETAILS?.[f]?.[ctx.lang] || f}>
              <span
                onClick={() => setActiveFw(activeFw === f ? null : f)}
                className={cx(
                  'fw-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700 border border-ink-600 text-[12.5px] text-ink-50',
                  activeFw === f && 'border-teal-500/50 bg-teal-500/10'
                )}
              >
                <Icon name="package" size={11} className="text-teal-400"/>{f}
              </span>
            </Tooltip>
          ))}
        </div>
        {activeFw && window.DATA.FRAMEWORK_DETAILS?.[activeFw] && (
          <div className="mt-3 detail-panel px-4 py-3 rounded-lg border border-ink-700 bg-ink-900/60">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon name="package" size={13} className="text-teal-400"/>
                <span className="text-ink-50 font-medium text-[13px]">{activeFw}</span>
              </div>
              <button onClick={() => setActiveFw(null)} className="text-ink-300 hover:text-ink-100">
                <Icon name="x" size={14}/>
              </button>
            </div>
            <p className="text-ink-200 text-[13px] leading-relaxed">
              {window.DATA.FRAMEWORK_DETAILS[activeFw][ctx.lang]}
            </p>
          </div>
        )}
      </Card>

      {/* README */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 h-11 border-b border-ink-700">
          <div className="flex items-center gap-2">
            <Icon name="file-text" size={14} className="text-ink-200"/>
            <span className="text-ink-50 font-medium text-[13.5px]">{t.overview.readme}</span>
          </div>
          <Button size="sm" variant="ghost"><Icon name="external-link" size={12}/></Button>
        </div>
        <div className="p-6 prose-readme">
          <Markdown text={(session && session.readme) || window.DATA.README_MD}/>
        </div>
      </Card>
    </div>
  );
}

// Tiny markdown renderer (headings, bold, code, lists)
function Markdown({ text }) {
  const lines = text.split('\n');
  const out = [];
  let inCode = false;
  let codeBuf = [];
  let listBuf = [];
  const flushList = () => {
    if (listBuf.length) {
      out.push(<ul key={'ul'+out.length} className="list-disc pl-5 space-y-1 my-3 text-ink-100">
        {listBuf.map((l, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inlineMd(l) }}/>)}
      </ul>);
      listBuf = [];
    }
  };
  lines.forEach((ln, i) => {
    if (ln.startsWith('```')) {
      if (inCode) {
        out.push(<pre key={'cb'+i} className="code-bg rounded-lg border border-ink-700 p-3 my-3 text-[12.5px] font-mono overflow-x-auto"><code>{codeBuf.join('\n')}</code></pre>);
        codeBuf = []; inCode = false;
      } else { inCode = true; }
      return;
    }
    if (inCode) { codeBuf.push(ln); return; }
    if (ln.startsWith('# ')) { flushList(); out.push(<h1 key={i} className="text-2xl font-semibold text-ink-50 mt-1 mb-2 tracking-tight">{ln.slice(2)}</h1>); return; }
    if (ln.startsWith('## ')) { flushList(); out.push(<h2 key={i} className="text-lg font-semibold text-ink-50 mt-5 mb-2 tracking-tight">{ln.slice(3)}</h2>); return; }
    if (ln.startsWith('> ')) { flushList(); out.push(<blockquote key={i} className="border-l-2 border-teal-500/60 pl-3 my-3 italic text-ink-200">{ln.slice(2)}</blockquote>); return; }
    if (ln.startsWith('- ')) { listBuf.push(ln.slice(2)); return; }
    if (ln.trim() === '') { flushList(); return; }
    flushList();
    out.push(<p key={i} className="text-ink-100 leading-relaxed my-2 text-[14px]" dangerouslySetInnerHTML={{ __html: inlineMd(ln) }}/>);
  });
  flushList();
  return <div>{out}</div>;
}
function inlineMd(s) {
  return s
    .replace(/`([^`]+)`/g, '<code class="font-mono text-[12.5px] bg-ink-700 border border-ink-600 px-1 py-px rounded text-teal-300">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-ink-50 font-semibold">$1</strong>')
    .replace(/_([^_]+)_/g, '<em class="text-ink-100">$1</em>');
}

window.ScanPage = ScanPage;
window.Markdown = Markdown;
