// Scan tabs (continued): Architecture, Flow, Modules, Security, Docs, File viewer.

// -------------------- Tab: Architecture --------------------
function ArchitectureTab({ ctx, ready, session }) {
  const t = ctx.t;
  const [mode, setMode] = React.useState('compact');

  // Use real arch graph from the backend when present, otherwise mock data.
  const liveArch = session && session.arch && session.arch.nodes && session.arch.nodes.length;
  const ARCH_NODES = liveArch ? session.arch.nodes : window.DATA.ARCH_NODES;
  const ARCH_EDGES = liveArch ? session.arch.edges : window.DATA.ARCH_EDGES;

  if (!ready) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-ink-200 mb-4">
          <Spinner size={12} className="text-teal-400"/>
          <span className="text-sm">{t.arch.loading}</span>
        </div>
        <Skeleton className="h-[440px] rounded-xl2"/>
      </div>
    );
  }

  const layerColor = {
    frontend: '#60a5fa',
    backend:  '#14B8A6',
    edge:     '#a78bfa',
    infra:    '#f59e0b',
    tooling:  '#94a3b8',
    data:     '#f472b6',
  };

  const nodeMap = Object.fromEntries(ARCH_NODES.map(n => [n.id, n]));
  const NODE_W = 160, NODE_H = 64;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-ink-50 text-lg font-semibold">{t.tabs.architecture}</h2>
          <p className="text-ink-300 text-[12.5px] mt-0.5">{ctx.lang === 'vi' ? 'Sơ đồ block tự sinh từ AST + RAG.' : 'Block diagram auto-generated from AST + RAG.'}</p>
        </div>
        <SegControl value={mode} onChange={setMode} options={[
          { value: 'compact',  label: t.arch.compact },
          { value: 'detailed', label: t.arch.detailed },
        ]}/>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="bg-ink-900/40 bg-grid p-6 overflow-x-auto">
          <svg width="760" height="440" className="block">
            {/* edges */}
            {ARCH_EDGES.map(([a, b], i) => {
              const A = nodeMap[a]; const B = nodeMap[b];
              if (!A || !B) return null;
              const x1 = A.x + NODE_W / 2, y1 = A.y + NODE_H / 2;
              const x2 = B.x + NODE_W / 2, y2 = B.y + NODE_H / 2;
              const mx = (x1 + x2) / 2;
              return (
                <g key={i}>
                  <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} className="arch-edge" markerEnd="url(#arrow)"/>
                </g>
              );
            })}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="#5A6273"/>
              </marker>
            </defs>
            {/* nodes */}
            {ARCH_NODES.map(n => (
              <g key={n.id} transform={`translate(${n.x},${n.y})`} className="cursor-pointer">
                <rect width={NODE_W} height={NODE_H} rx="10" className="arch-node"/>
                <rect width="3" height={NODE_H} rx="1.5" fill={layerColor[n.layer] || '#94a3b8'}/>
                <text x="14" y="26" className="arch-node-title">{n.label}</text>
                {mode === 'detailed' && <text x="14" y="46" className="arch-node-sub">{n.sub}</text>}
              </g>
            ))}
          </svg>
        </div>

        <div className="px-5 py-3 border-t border-ink-700 bg-ink-800 flex items-center gap-4 flex-wrap">
          <span className="text-[11.5px] text-ink-300 uppercase tracking-wider">{t.arch.legend}</span>
          {Object.entries(layerColor).map(([k, c]) => (
            <span key={k} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-100">
              <span className="w-2.5 h-2.5 rounded-sm" style={{background: c}}/>{k}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// -------------------- Tab: Flow --------------------
function FlowTab({ ctx, ready }) {
  const t = ctx.t;
  const [useCase, setUseCase] = React.useState('login');

  if (!ready) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-ink-200 mb-4"><Spinner size={12} className="text-teal-400"/><span className="text-sm">{t.flow.loading}</span></div>
        <Skeleton className="h-[440px] rounded-xl2"/>
      </div>
    );
  }

  const flow = window.DATA.FLOWS[useCase];
  const ACTORS = flow.actors;
  const COL = 150, TOP = 60, ROW = 56;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-ink-50 text-lg font-semibold">{t.tabs.flow}</h2>
          <p className="text-ink-300 text-[12.5px] mt-0.5">{flow.name[ctx.lang]}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-ink-300">{t.flow.selectUseCase}:</span>
          <select value={useCase} onChange={e => setUseCase(e.target.value)} className="text-sm">
            {Object.entries(window.DATA.FLOWS).map(([k, v]) => <option key={k} value={k}>{v.name[ctx.lang]}</option>)}
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="bg-ink-900/40 bg-grid p-6 overflow-x-auto">
          <svg width={ACTORS.length * COL + 40} height={TOP + flow.steps.length * ROW + 40}>
            {/* Actors */}
            {ACTORS.map((a, i) => {
              const x = 20 + i * COL + COL / 2;
              return (
                <g key={a}>
                  <rect x={20 + i * COL + 10} y="16" width={COL - 20} height="36" rx="8" className="arch-node"/>
                  <text x={x} y="38" textAnchor="middle" className="arch-node-title">{a}</text>
                  <line x1={x} y1="56" x2={x} y2={TOP + flow.steps.length * ROW + 20} stroke="#262C37" strokeDasharray="3 4"/>
                </g>
              );
            })}
            {/* Steps */}
            {flow.steps.map((s, i) => {
              const fx = 20 + ACTORS.indexOf(s.from) * COL + COL / 2;
              const tx = 20 + ACTORS.indexOf(s.to)   * COL + COL / 2;
              const y = TOP + i * ROW;
              const dir = tx > fx ? 1 : -1;
              return (
                <g key={i}>
                  <line x1={fx} y1={y} x2={tx} y2={y} stroke="#5A6273" strokeWidth="1.5" markerEnd="url(#arrow2)"/>
                  <rect x={Math.min(fx, tx) + 8} y={y - 22} width={Math.abs(tx - fx) - 16} height="20" rx="4" fill="#11141A" stroke="#262C37"/>
                  <text x={(fx + tx) / 2} y={y - 8} textAnchor="middle" fill="#C9CFDB" style={{ font: '11.5px Inter' }}>{s.label}</text>
                  <text x={20} y={y + 4} fill="#5A6273" style={{ font: '10.5px JetBrains Mono' }}>{String(i + 1).padStart(2, '0')}</text>
                </g>
              );
            })}
            <defs>
              <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="#5A6273"/>
              </marker>
            </defs>
          </svg>
        </div>
      </Card>
    </div>
  );
}

// -------------------- Tab: Modules --------------------
function ModulesTab({ ctx, ready, session }) {
  const t = ctx.t;
  const [search, setSearch] = React.useState('');
  const [riskFilter, setRiskFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'files', dir: 'desc' });

  if (!ready) {
    return <div className="p-6 max-w-5xl mx-auto space-y-2">{Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-12"/>)}</div>;
  }

  const source = (session && session.modules && session.modules.length) ? session.modules : window.DATA.MODULES;
  let mods = source.filter(m => {
    if (riskFilter !== 'all' && m.risk !== riskFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.purpose[ctx.lang].toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  mods = [...mods].sort((a, b) => {
    const k = sort.key;
    let av = a[k], bv = b[k];
    if (k === 'purpose') { av = a.purpose[ctx.lang]; bv = b.purpose[ctx.lang]; }
    if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sort.dir === 'asc' ? av - bv : bv - av;
  });

  const HeadCell = ({ k, children, align = 'left' }) => (
    <th className={cx('text-[11.5px] uppercase tracking-wide font-medium px-3 py-2.5 text-ink-300', align === 'right' ? 'text-right' : 'text-left')}>
      <button onClick={() => setSort(s => ({ key: k, dir: s.key === k ? (s.dir === 'asc' ? 'desc' : 'asc') : 'desc' }))} className="hover:text-ink-100 inline-flex items-center gap-1">
        {children}
        {sort.key === k && <Icon name={sort.dir === 'asc' ? 'arrow-up' : 'arrow-down'} size={10}/>}
      </button>
    </th>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-ink-50 text-lg font-semibold">{t.tabs.modules}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 h-8 rounded-lg bg-ink-900 border border-ink-700">
            <Icon name="search" size={13} className="text-ink-300"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.mod.search} className="bg-transparent outline-none text-[13px] text-ink-50 placeholder:text-ink-300 w-44"/>
          </div>
          <SegControl size="sm" value={riskFilter} onChange={setRiskFilter} options={[
            { value: 'all',    label: t.mod.filterAll },
            { value: 'Low',    label: 'Low' },
            { value: 'Medium', label: 'Med' },
            { value: 'High',   label: 'High' },
          ]}/>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-900">
            <tr className="border-b border-ink-700">
              <HeadCell k="name">{t.mod.header.name}</HeadCell>
              <HeadCell k="purpose">{t.mod.header.purpose}</HeadCell>
              <HeadCell k="lang">{t.mod.header.lang}</HeadCell>
              <HeadCell k="files" align="right">{t.mod.header.files}</HeadCell>
              <HeadCell k="fns" align="right">{t.mod.header.fns}</HeadCell>
              <HeadCell k="risk">{t.mod.header.risk}</HeadCell>
            </tr>
          </thead>
          <tbody>
            {mods.map(m => (
              <tr key={m.name} className="border-b border-ink-700/60 hover:bg-ink-700/30 transition-colors">
                <td className="px-3 py-2.5"><span className="font-mono text-ink-50">{m.name}</span></td>
                <td className="px-3 py-2.5 text-ink-200 text-[13px]">{m.purpose[ctx.lang]}</td>
                <td className="px-3 py-2.5"><LangIcon lang={m.lang} size={14}/></td>
                <td className="px-3 py-2.5 text-right font-mono text-ink-100 text-[13px]">{m.files}</td>
                <td className="px-3 py-2.5 text-right font-mono text-ink-100 text-[13px]">{m.fns}</td>
                <td className="px-3 py-2.5"><RiskChip level={m.risk}/></td>
              </tr>
            ))}
            {mods.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-ink-300">No modules match your filter.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// -------------------- Tab: Security --------------------
function SecurityTab({ ctx, ready, session }) {
  const t = ctx.t;
  const [filter, setFilter] = React.useState('all');
  const [open, setOpen] = React.useState(null); // F-id with patch open
  if (!ready) {
    return <div className="p-6 max-w-5xl mx-auto space-y-3">{Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-32"/>)}</div>;
  }
  const sourceFindings = (session && session.security && session.security.length)
    ? session.security
    : (session.id === 'sess-vercel-next' ? window.DATA.SECURITY_FINDINGS : []);
  if (sourceFindings.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card className="p-10 text-center">
          <Icon name="shield" size={28} className="text-teal-400 mx-auto mb-3"/>
          <h3 className="text-ink-50 font-medium mb-1">{t.sec.empty}</h3>
          <p className="text-ink-300 text-sm">{ctx.lang === 'vi' ? 'Quét lại bất cứ lúc nào.' : 'Re-scan any time.'}</p>
        </Card>
      </div>
    );
  }
  const findings = sourceFindings.filter(f => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return f.confirmed;
    if (filter === 'fp') return f.falsePositive;
    return f.severity === filter;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-ink-50 text-lg font-semibold">{t.sec.title}</h2>
          <p className="text-ink-300 text-[12.5px] mt-0.5">{ctx.lang === 'vi' ? '6 finding · 2 đã xác nhận · 2 false-positive' : '6 findings · 2 confirmed · 2 false-positive'}</p>
        </div>
        <SegControl size="sm" value={filter} onChange={setFilter} options={[
          { value: 'all',       label: t.sec.filterAll },
          { value: 'high',      label: 'High' },
          { value: 'medium',    label: 'Med' },
          { value: 'confirmed', label: '✓ Confirmed' },
          { value: 'fp',        label: 'FP' },
        ]}/>
      </div>

      <div className="space-y-3">
        {findings.map(f => (
          <Card key={f.id} className={cx(
            'p-0 overflow-hidden',
            f.severity === 'high' && 'border-red-500/30',
            f.severity === 'medium' && 'border-amber-500/25',
            f.falsePositive && 'opacity-70 border-ink-700',
          )}>
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="pt-0.5"><Severity level={f.severity}/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-ink-50 font-medium text-[14px]">{f.title[ctx.lang]}</h3>
                  {f.confirmed && <Badge tone="green"><Icon name="check-circle" size={10}/>{t.sec.confirmed}</Badge>}
                  {!f.confirmed && !f.falsePositive && <Badge tone="amber"><Icon name="bug" size={10}/>{t.sec.heuristic}</Badge>}
                  {f.falsePositive && <Badge tone="slate"><Icon name="x-circle" size={10}/>{t.sec.falsePositive}</Badge>}
                  <Badge tone="slate" className="font-mono">{f.rule}</Badge>
                </div>
                <p className="text-ink-200 text-[13px] mb-2 leading-relaxed">{f.why[ctx.lang]}</p>
                <div className="flex items-center gap-3 text-[12px] text-ink-300 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="file-code" size={11}/><span className="text-ink-100">{f.file}</span>:<span className="text-teal-400">{f.line}</span>
                  </span>
                  {f.refs.map(r => <Badge key={r} tone="slate">{r}</Badge>)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => setOpen(open === f.id ? null : f.id)}>
                  <Icon name={open === f.id ? 'chevron-up' : 'sparkles'} size={12}/>
                  {t.sec.suggest}
                </Button>
                <Button size="sm" variant="ghost"><Icon name="external-link" size={12}/>{t.sec.viewFile}</Button>
              </div>
            </div>

            {/* Code preview always visible */}
            <div className="px-5 pb-4">
              <div className="text-[11.5px] uppercase tracking-wider text-ink-300 mb-1.5">{t.sec.code}</div>
              <CodeBlock code={f.code} lang="ts"/>
            </div>

            {open === f.id && !f.falsePositive && (
              <div className="border-t border-ink-700 bg-ink-900/40 px-5 py-4 fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11.5px] uppercase tracking-wider text-ink-300">{t.sec.patchPreview}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline"><Icon name="copy" size={11}/>diff</Button>
                    <Button size="sm" variant="primary"><Icon name="git-pull-request" size={11}/>{t.sec.applyPR}</Button>
                  </div>
                </div>
                <DiffView before={f.code} after={f.suggested}/>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function DiffView({ before, after }) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  return (
    <div className="grid grid-cols-2 gap-2 text-[12.5px] font-mono">
      <div className="code-bg rounded-lg border border-ink-700 overflow-hidden">
        <div className="px-3 py-1.5 text-[11px] text-red-300 border-b border-ink-700 bg-red-500/5">- before</div>
        {beforeLines.map((l, i) => <div key={i} className="diff-del px-3 py-0.5 leading-[1.7]">{l || '\u00A0'}</div>)}
      </div>
      <div className="code-bg rounded-lg border border-ink-700 overflow-hidden">
        <div className="px-3 py-1.5 text-[11px] text-emerald-300 border-b border-ink-700 bg-emerald-500/5">+ after</div>
        {afterLines.map((l, i) => <div key={i} className="diff-add px-3 py-0.5 leading-[1.7]">{l || '\u00A0'}</div>)}
      </div>
    </div>
  );
}

// -------------------- Tab: Documentation --------------------
function DocsTab({ ctx, ready, session }) {
  const t = ctx.t;
  const isReal = session && session.id !== 'sess-vercel-next' && session.id !== 'sess-acme-orders';
  const [doc, setDoc] = React.useState(window.DATA.GENERATED_DOC);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isReal) { setDoc(window.DATA.GENERATED_DOC); return; }
    let cancel = false;
    setLoading(true);
    window.API.docMd(session.id, ctx.lang)
      .then(j => { if (!cancel) setDoc(j.content || ''); })
      .catch(() => {})
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [isReal, session && session.id, ctx.lang]);

  const downloadMd = () => {
    const blob = new Blob([doc], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (isReal ? (session.repo.owner + '-' + session.repo.name) : 'next.js') + '.md';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copyMd = () => {
    navigator.clipboard?.writeText(doc);
  };

  if (!ready) {
    return <div className="p-6 max-w-4xl mx-auto"><Skeleton className="h-[600px]"/></div>;
  }
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-ink-50 text-lg font-semibold">{t.doc.generated}</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={downloadMd}><Icon name="download" size={12}/>{t.doc.dlMd}</Button>
          <Button size="sm" variant="outline" onClick={copyMd}><Icon name="copy" size={12}/>Copy</Button>
        </div>
      </div>
      <Card className="p-8">
        {loading ? <Spinner size={14}/> : <Markdown text={doc}/>}
      </Card>
    </div>
  );
}

// -------------------- File Viewer (opened from tree or chat citation) --------------------
function FileViewer({ ctx, file, session }) {
  const isRealSession = session && session.id
    && session.id !== 'sess-vercel-next' && session.id !== 'sess-acme-orders';
  const stub = `// ${file.file}\n// (open this scan with a backend session to view real content)\n`;
  const [code, setCode] = React.useState(isRealSession ? '' : stub);
  const [loading, setLoading] = React.useState(isRealSession);
  const [err, setErr] = React.useState(null);
  const [binary, setBinary] = React.useState(false);

  React.useEffect(() => {
    if (!isRealSession) return;
    let cancel = false;
    setLoading(true); setErr(null); setBinary(false);
    window.API.getFile(session.id, file.file)
      .then(j => { if (cancel) return;
        if (j.binary) { setBinary(true); setCode(''); }
        else { setCode(j.content || ''); }
      })
      .catch(e => { if (!cancel) setErr(String(e.message || e)); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [session && session.id, file.file]);

  const lineCount = code ? code.split('\n').length : (file.loc || 0);
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <LangIcon lang={file.lang || 'ts'} size={14}/>
        <span className="font-mono text-ink-50 text-sm break-all">{file.file}</span>
        {file.range && <Badge tone="teal">L{file.range}</Badge>}
        <span className="ml-auto text-ink-300 text-xs">{lineCount} lines</span>
      </div>
      {loading && <div className="flex items-center gap-2 text-ink-300 text-sm"><Spinner size={12} className="text-teal-400"/>Loading…</div>}
      {err && <div className="text-red-300 text-sm">Error: {err}</div>}
      {binary && <div className="text-ink-300 text-sm italic">Binary file — preview not available.</div>}
      {!loading && !err && !binary && <CodeBlock code={code} lang={file.lang || 'ts'}/>}
    </div>
  );
}

window.ArchitectureTab = ArchitectureTab;
window.FlowTab = FlowTab;
window.ModulesTab = ModulesTab;
window.SecurityTab = SecurityTab;
window.DocsTab = DocsTab;
window.FileViewer = FileViewer;
