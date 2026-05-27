// Scan tabs (continued): Architecture, Flow, Modules, Security, Docs, File viewer.
// ENHANCED: Interactive diagrams, click-to-detail, donut charts, impact meters.

// -------------------- Tab: Architecture (Interactive) --------------------
function ArchitectureTab({ ctx, ready, session }) {
  const t = ctx.t;
  const [mode, setMode] = React.useState('detailed');
  const [activeNode, setActiveNode] = React.useState(null);
  const [hoveredNode, setHoveredNode] = React.useState(null);
  const [zoom, setZoom] = React.useState(1);

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

  // Find connected nodes for a given node
  const getConnected = (nodeId) => {
    const connected = new Set();
    const connectedEdgeIndices = new Set();
    ARCH_EDGES.forEach((e, i) => {
      const [a, b] = e;
      if (a === nodeId) { connected.add(b); connectedEdgeIndices.add(i); }
      if (b === nodeId) { connected.add(a); connectedEdgeIndices.add(i); }
    });
    return { nodes: connected, edges: connectedEdgeIndices };
  };

  const hovered = hoveredNode || (activeNode ? activeNode : null);
  const connections = hovered ? getConnected(hovered) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-ink-50 text-lg font-semibold">{t.tabs.architecture}</h2>
          <p className="text-ink-300 text-[12.5px] mt-0.5">{ctx.lang === 'vi' ? 'Click vào node để xem chi tiết · Hover để highlight kết nối' : 'Click nodes for details · Hover to highlight connections'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} title="Zoom out">
              <Icon name="minus" size={14}/>
            </button>
            <span className="text-ink-300 text-[11px] font-mono w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button className="zoom-btn" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} title="Zoom in">
              <Icon name="plus" size={14}/>
            </button>
            <button className="zoom-btn" onClick={() => setZoom(1)} title="Reset">
              <Icon name="monitor" size={12}/>
            </button>
          </div>
          <SegControl value={mode} onChange={setMode} options={[
            { value: 'compact',  label: t.arch.compact },
            { value: 'detailed', label: t.arch.detailed },
          ]}/>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="bg-ink-900/40 bg-grid p-6 overflow-x-auto">
          <svg width={760 * zoom} height={440 * zoom} className="block" viewBox="0 0 760 440">
            {/* edges */}
            {ARCH_EDGES.map((e, i) => {
              const [a, b, meta] = e;
              const A = nodeMap[a]; const B = nodeMap[b];
              if (!A || !B) return null;
              const x1 = A.x + NODE_W / 2, y1 = A.y + NODE_H / 2;
              const x2 = B.x + NODE_W / 2, y2 = B.y + NODE_H / 2;
              const mx = (x1 + x2) / 2;
              const isHighlighted = connections && connections.edges.has(i);
              const dimmed = hovered && !isHighlighted;
              return (
                <g key={i}>
                  <path
                    d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                    className={cx('arch-edge', isHighlighted && 'arch-edge-highlight')}
                    style={{ opacity: dimmed ? 0.15 : 1 }}
                    markerEnd="url(#arrow)"
                  />
                  {/* Edge label on hover */}
                  {meta && meta.label && (mode === 'detailed' || isHighlighted) && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 8}
                      textAnchor="middle"
                      fill={isHighlighted ? '#2DD4BF' : '#5A6273'}
                      style={{ font: '10px Inter, sans-serif', transition: 'fill .2s' }}
                    >
                      {meta.label}
                    </text>
                  )}
                </g>
              );
            })}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="#5A6273"/>
              </marker>
            </defs>
            {/* nodes */}
            {ARCH_NODES.map(n => {
              const isActive = activeNode === n.id;
              const isConnected = connections && (connections.nodes.has(n.id) || hovered === n.id);
              const dimmed = hovered && !isConnected && hovered !== n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  className={cx('arch-node-group', isActive && 'active')}
                  onClick={() => setActiveNode(activeNode === n.id ? null : n.id)}
                  onMouseEnter={() => setHoveredNode(n.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ opacity: dimmed ? 0.3 : 1, transition: 'opacity .2s' }}
                >
                  <rect width={NODE_W} height={NODE_H} rx="10" className="arch-node"/>
                  <rect width="3" height={NODE_H} rx="1.5" fill={layerColor[n.layer] || '#94a3b8'}/>
                  <text x="14" y="26" className="arch-node-title">{n.label}</text>
                  {mode === 'detailed' && <text x="14" y="46" className="arch-node-sub">{n.sub}</text>}
                  {isActive && (
                    <rect x="0" y="0" width={NODE_W} height={NODE_H} rx="10" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeDasharray="4 3">
                      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite"/>
                    </rect>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-ink-700 bg-ink-800 flex items-center gap-4 flex-wrap">
          <span className="text-[11.5px] text-ink-300 uppercase tracking-wider">{t.arch.legend}</span>
          {Object.entries(layerColor).map(([k, c]) => (
            <span key={k} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-100">
              <span className="w-2.5 h-2.5 rounded-sm" style={{background: c}}/>{k}
            </span>
          ))}
        </div>

        {/* Detail panel for selected node */}
        {activeNode && nodeMap[activeNode] && (() => {
          const n = nodeMap[activeNode];
          const conn = getConnected(activeNode);
          const connectedNodes = Array.from(conn.nodes).map(id => nodeMap[id]).filter(Boolean);
          return (
            <DetailPanel onClose={() => setActiveNode(null)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-sm" style={{ background: layerColor[n.layer] || '#94a3b8' }}/>
                    <h3 className="text-ink-50 font-semibold text-[15px]">{n.label}</h3>
                    <Badge tone="teal">{n.layer}</Badge>
                  </div>
                  <p className="text-ink-200 text-[13px] leading-relaxed mb-4">
                    {n.detail ? n.detail[ctx.lang] : n.sub}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    {n.files && (
                      <div>
                        <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-1">{ctx.lang === 'vi' ? 'Files' : 'Files'}</div>
                        <div className="text-ink-50 font-mono">{n.files}</div>
                      </div>
                    )}
                    {n.loc && (
                      <div>
                        <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-1">LOC</div>
                        <div className="text-ink-50 font-mono">{n.loc.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-2">{ctx.lang === 'vi' ? 'Kết nối tới' : 'Connected to'}</div>
                  <div className="space-y-1.5">
                    {connectedNodes.map(cn => (
                      <button
                        key={cn.id}
                        onClick={() => setActiveNode(cn.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-900/60 border border-ink-700/60 hover:border-teal-500/30 transition-colors text-left"
                      >
                        <span className="w-2 h-2 rounded-sm" style={{ background: layerColor[cn.layer] || '#94a3b8' }}/>
                        <span className="text-ink-100 text-[13px]">{cn.label}</span>
                        <span className="text-ink-300 text-[11px] ml-auto">{cn.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </DetailPanel>
          );
        })()}
      </Card>
    </div>
  );
}

// -------------------- Tab: Flow (Interactive) --------------------
function FlowTab({ ctx, ready }) {
  const t = ctx.t;
  const [useCase, setUseCase] = React.useState('login');
  const [activeStep, setActiveStep] = React.useState(null);
  const [activeActor, setActiveActor] = React.useState(null);

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
          <p className="text-ink-300 text-[12.5px] mt-0.5">{ctx.lang === 'vi' ? 'Click vào step hoặc actor để xem chi tiết' : 'Click steps or actors for details'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-ink-300">{t.flow.selectUseCase}:</span>
          <select value={useCase} onChange={e => { setUseCase(e.target.value); setActiveStep(null); setActiveActor(null); }} className="text-sm">
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
              const isActive = activeActor === a;
              return (
                <g key={a} className="cursor-pointer" onClick={() => setActiveActor(activeActor === a ? null : a)}>
                  <rect x={20 + i * COL + 10} y="16" width={COL - 20} height="36" rx="8"
                    className="arch-node"
                    style={{ stroke: isActive ? '#2DD4BF' : undefined, strokeWidth: isActive ? 2 : undefined }}
                  />
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
              const isActive = activeStep === i;
              return (
                <g key={i} className={cx('flow-step', isActive && 'active')} onClick={() => setActiveStep(activeStep === i ? null : i)}>
                  <line x1={fx} y1={y} x2={tx} y2={y} stroke={isActive ? '#14B8A6' : '#5A6273'} strokeWidth={isActive ? 2 : 1.5} markerEnd="url(#arrow2)"/>
                  <rect x={Math.min(fx, tx) + 8} y={y - 22} width={Math.abs(tx - fx) - 16} height="20" rx="4" fill={isActive ? 'rgba(20,184,166,.08)' : '#11141A'} stroke={isActive ? '#2DD4BF' : '#262C37'}/>
                  <text x={(fx + tx) / 2} y={y - 8} textAnchor="middle" fill={isActive ? '#F4F6FA' : '#C9CFDB'} style={{ font: '11.5px Inter' }}>{s.label}</text>
                  <text x={20} y={y + 4} fill={isActive ? '#14B8A6' : '#5A6273'} style={{ font: '10.5px JetBrains Mono' }}>{String(i + 1).padStart(2, '0')}</text>
                  {/* Data flow label */}
                  {s.dataFlow && isActive && (
                    <text x={(fx + tx) / 2} y={y + 14} textAnchor="middle" fill="#8C95A8" style={{ font: 'italic 9.5px Inter' }}>
                      ↕ {s.dataFlow}
                    </text>
                  )}
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

        {/* Actor detail panel */}
        {activeActor && flow.actorInfo && flow.actorInfo[activeActor] && (
          <DetailPanel onClose={() => setActiveActor(null)}>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-ink-50 font-semibold text-[15px]">{activeActor}</h3>
              <Badge tone="teal">{flow.actorInfo[activeActor].tech}</Badge>
            </div>
            <p className="text-ink-200 text-[13px] leading-relaxed">
              {flow.actorInfo[activeActor][ctx.lang]}
            </p>
          </DetailPanel>
        )}

        {/* Step detail panel */}
        {activeStep !== null && flow.steps[activeStep] && (
          <DetailPanel onClose={() => setActiveStep(null)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge tone="teal">Step {activeStep + 1}</Badge>
                  <span className="text-ink-50 font-medium text-[14px]">{flow.steps[activeStep].label}</span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-[12.5px] text-ink-300">
                  <Icon name="arrow-right" size={11}/>
                  <span className="text-ink-100">{flow.steps[activeStep].from}</span>
                  <span>→</span>
                  <span className="text-ink-100">{flow.steps[activeStep].to}</span>
                </div>
                <p className="text-ink-200 text-[13px] leading-relaxed">
                  {flow.steps[activeStep].detail ? flow.steps[activeStep].detail[ctx.lang] : flow.steps[activeStep].label}
                </p>
              </div>
              <div>
                {flow.steps[activeStep].dataFlow && (
                  <div>
                    <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-2">{ctx.lang === 'vi' ? 'Dữ liệu truyền' : 'Data flow'}</div>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-900/60 border border-ink-700/60 text-[13px] text-teal-300 font-mono">
                      <Icon name="zap" size={12}/>{flow.steps[activeStep].dataFlow}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DetailPanel>
        )}
      </Card>
    </div>
  );
}

// -------------------- Tab: Modules (Expandable) --------------------
function ModulesTab({ ctx, ready, session }) {
  const t = ctx.t;
  const [search, setSearch] = React.useState('');
  const [riskFilter, setRiskFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'files', dir: 'desc' });
  const [expanded, setExpanded] = React.useState(null);

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
        <div>
          <h2 className="text-ink-50 text-lg font-semibold">{t.tabs.modules}</h2>
          <p className="text-ink-300 text-[12.5px] mt-0.5">{ctx.lang === 'vi' ? 'Click vào module để xem chi tiết đầy đủ' : 'Click a module row for full details'}</p>
        </div>
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
              <React.Fragment key={m.name}>
                <tr
                  className={cx('border-b border-ink-700/60 mod-row transition-colors cursor-pointer', expanded === m.name && 'expanded')}
                  onClick={() => setExpanded(expanded === m.name ? null : m.name)}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Icon name={expanded === m.name ? 'chevron-down' : 'chevron-right'} size={11} className="text-ink-300"/>
                      <span className="font-mono text-ink-50">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-ink-200 text-[13px]">{m.purpose[ctx.lang]}</td>
                  <td className="px-3 py-2.5"><LangIcon lang={m.lang} size={14}/></td>
                  <td className="px-3 py-2.5 text-right font-mono text-ink-100 text-[13px]">{m.files}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-ink-100 text-[13px]">{m.fns}</td>
                  <td className="px-3 py-2.5"><RiskChip level={m.risk}/></td>
                </tr>
                {expanded === m.name && (
                  <tr>
                    <td colSpan="6" className="p-0">
                      <div className="expand-panel border-b border-ink-700 bg-ink-900/40 px-6 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Description */}
                          <div className="md:col-span-2">
                            <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-2">{ctx.lang === 'vi' ? 'Mô tả chi tiết' : 'Detailed description'}</div>
                            <p className="text-ink-200 text-[13px] leading-relaxed mb-4">
                              {m.detail ? m.detail[ctx.lang] : m.purpose[ctx.lang]}
                            </p>

                            {/* Top functions */}
                            {m.topFns && m.topFns.length > 0 && (
                              <div className="mb-4">
                                <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-2">{ctx.lang === 'vi' ? 'Functions chính' : 'Key functions'}</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {m.topFns.map(fn => (
                                    <span key={fn} className="inline-flex items-center px-2 py-0.5 rounded-md bg-ink-800 border border-ink-700 text-[12px] font-mono text-teal-300">
                                      {fn}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dependencies */}
                            {m.deps && m.deps.length > 0 && (
                              <div>
                                <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-2">{ctx.lang === 'vi' ? 'Phụ thuộc' : 'Dependencies'}</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {m.deps.map(d => (
                                    <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink-800 border border-ink-700 text-[12px] text-ink-100">
                                      <Icon name="arrow-right" size={9} className="text-ink-300"/>{d}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Stats sidebar */}
                          <div className="space-y-4">
                            <div className="p-3 rounded-lg bg-ink-800 border border-ink-700">
                              <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-2">{ctx.lang === 'vi' ? 'Thống kê' : 'Stats'}</div>
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-[13px]">
                                  <span className="text-ink-300">Files</span>
                                  <span className="text-ink-50 font-mono">{m.files}</span>
                                </div>
                                <div className="flex items-center justify-between text-[13px]">
                                  <span className="text-ink-300">Functions</span>
                                  <span className="text-ink-50 font-mono">{m.fns}</span>
                                </div>
                                {m.loc && (
                                  <div className="flex items-center justify-between text-[13px]">
                                    <span className="text-ink-300">LOC</span>
                                    <span className="text-ink-50 font-mono">{m.loc.toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-[13px]">
                                  <span className="text-ink-300">Layer</span>
                                  <Badge tone="teal">{m.layer}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-[13px]">
                                  <span className="text-ink-300">Risk</span>
                                  <RiskChip level={m.risk}/>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {mods.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-ink-300">No modules match your filter.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// -------------------- Tab: Security (Enhanced) --------------------
function SecurityTab({ ctx, ready, session }) {
  const t = ctx.t;
  const [filter, setFilter] = React.useState('all');
  const [open, setOpen] = React.useState(null);
  const [detailOpen, setDetailOpen] = React.useState(null);

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

  // Severity counts for donut
  const counts = { high: 0, medium: 0, low: 0 };
  const confirmed = sourceFindings.filter(f => f.confirmed).length;
  const fp = sourceFindings.filter(f => f.falsePositive).length;
  sourceFindings.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });

  const donutSegments = [
    { pct: (counts.high / sourceFindings.length) * 100, color: '#EF4444' },
    { pct: (counts.medium / sourceFindings.length) * 100, color: '#F59E0B' },
    { pct: (counts.low / sourceFindings.length) * 100, color: '#FBBF24' },
  ];

  const findings = sourceFindings.filter(f => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return f.confirmed;
    if (filter === 'fp') return f.falsePositive;
    return f.severity === filter;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Summary header with donut chart */}
      <Card className="p-5 mb-5">
        <div className="flex items-center gap-6">
          <MiniDonut segments={donutSegments} size={64} strokeWidth={8}/>
          <div className="flex-1">
            <h2 className="text-ink-50 text-lg font-semibold mb-2">{t.sec.title}</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-[13px]">
                <span className="sev-dot" style={{background: '#EF4444'}}/> 
                <span className="text-ink-200">High: <strong className="text-ink-50">{counts.high}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px]">
                <span className="sev-dot" style={{background: '#F59E0B'}}/> 
                <span className="text-ink-200">Medium: <strong className="text-ink-50">{counts.medium}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px]">
                <span className="sev-dot" style={{background: '#FBBF24'}}/> 
                <span className="text-ink-200">Low: <strong className="text-ink-50">{counts.low}</strong></span>
              </div>
              <span className="text-ink-500">|</span>
              <span className="text-[13px] text-ink-200">
                <Icon name="check-circle" size={11} className="text-emerald-400 inline mr-1"/>
                {confirmed} {ctx.lang === 'vi' ? 'xác nhận' : 'confirmed'}
              </span>
              <span className="text-[13px] text-ink-200">
                <Icon name="x-circle" size={11} className="text-ink-300 inline mr-1"/>
                {fp} false-positive
              </span>
            </div>
          </div>
          <SegControl size="sm" value={filter} onChange={setFilter} options={[
            { value: 'all',       label: t.sec.filterAll },
            { value: 'high',      label: 'High' },
            { value: 'medium',    label: 'Med' },
            { value: 'confirmed', label: '✓' },
            { value: 'fp',        label: 'FP' },
          ]}/>
        </div>
      </Card>

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
                  {f.category && <Badge tone="slate">{f.category}</Badge>}
                  {f.confirmed && <Badge tone="green"><Icon name="check-circle" size={10}/>{t.sec.confirmed}</Badge>}
                  {!f.confirmed && !f.falsePositive && <Badge tone="amber"><Icon name="bug" size={10}/>{t.sec.heuristic}</Badge>}
                  {f.falsePositive && <Badge tone="slate"><Icon name="x-circle" size={10}/>{t.sec.falsePositive}</Badge>}
                  <Badge tone="slate" className="font-mono">{f.rule}</Badge>
                </div>
                <p className="text-ink-200 text-[13px] mb-2 leading-relaxed">{f.why[ctx.lang]}</p>

                {/* Impact meter */}
                {f.impact !== undefined && (
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-ink-300 text-[11px] uppercase tracking-wider w-12">Impact</span>
                    <div className="flex-1 max-w-[200px]">
                      <ImpactMeter value={f.impact} color={f.severity === 'high' ? '#EF4444' : f.severity === 'medium' ? '#F59E0B' : '#FBBF24'}/>
                    </div>
                    <span className="text-ink-200 text-[12px] font-mono w-8">{f.impact}%</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-[12px] text-ink-300 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="file-code" size={11}/><span className="text-ink-100">{f.file}</span>:<span className="text-teal-400">{f.line}</span>
                  </span>
                  {f.refs.map(r => <Badge key={r} tone="slate">{r}</Badge>)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                {/* Detail button */}
                <Button size="sm" variant="ghost" onClick={() => setDetailOpen(detailOpen === f.id ? null : f.id)}>
                  <Icon name={detailOpen === f.id ? 'chevron-up' : 'info'} size={12}/>
                  {ctx.lang === 'vi' ? 'Chi tiết' : 'Details'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOpen(open === f.id ? null : f.id)}>
                  <Icon name={open === f.id ? 'chevron-up' : 'sparkles'} size={12}/>
                  {t.sec.suggest}
                </Button>
                <Button size="sm" variant="ghost"><Icon name="external-link" size={12}/>{t.sec.viewFile}</Button>
              </div>
            </div>

            {/* Detailed analysis panel */}
            {detailOpen === f.id && f.detail && (
              <div className="border-t border-ink-700 bg-ink-900/30 px-5 py-4 fade-in">
                <div className="text-[11.5px] uppercase tracking-wider text-ink-300 mb-2">{ctx.lang === 'vi' ? 'Phân tích chi tiết' : 'Detailed analysis'}</div>
                <p className="text-ink-200 text-[13px] leading-relaxed">{f.detail[ctx.lang]}</p>
              </div>
            )}

            {/* Code preview */}
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

// -------------------- File Viewer --------------------
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
