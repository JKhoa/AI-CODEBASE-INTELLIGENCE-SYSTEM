'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/src/context/AppContext';
import Icon from '@/src/components/Icon';
import {
  Button, Card, Badge, Skeleton, Spinner, SegControl, RiskChip, LangIcon, Severity,
  CodeBlock, Markdown, ContradictionAlert, BeginnerGuideCard, SuitabilityCard, RichQACard
} from '@/src/components/ui';
import API from '@/src/lib/api';
import DATA from '@/src/lib/data';
import cx from '@/src/lib/cx';

const InteractiveGraph = dynamic(() => import('@/src/components/InteractiveGraph'), { ssr: false });


// ----- Overview ----------------------------------------------------------
export function OverviewTab({ session, ready, stage }) {
  const ctx = useApp(); const t = ctx.t;
  if (!ready) {
    const statusText = {
      cloning: 'Đang tải Repository từ GitHub...',
      parsing: `Đang phân tích cú pháp AST (${session?.stats?.files || 0} files tìm thấy)...`,
      indexing: `Đang xây dựng đồ thị kiến trúc (${session?.arch?.nodes?.length || 0} nodes)...`,
      summarizing: `Đang phân tích nghiệp vụ bằng Gemini AI...`,
      ready: 'Hoàn tất.',
      failed: 'Quá trình phân tích thất bại!',
    }[stage] || 'Đang xử lý dữ liệu...';

    const isFailed = stage === 'failed';
    const stageOrder = ['cloning', 'parsing', 'indexing', 'summarizing'];
    const currentIdx = stageOrder.indexOf(stage);

    return (
      <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-lg bg-ink-900 border border-ink-700 rounded-lg overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-2 bg-ink-800 border-b border-ink-700">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            <span className="ml-2 text-[12px] font-mono text-ink-300">Scanner.exe</span>
            {!isFailed && (
              <span className="ml-auto text-[10px] font-mono text-ink-400">
                Stage {currentIdx + 1}/{stageOrder.length}
              </span>
            )}
          </div>
          <div className="p-6 font-mono text-sm space-y-4">
            <div className={`flex items-center gap-3 ${isFailed ? 'text-red-400' : 'text-teal-400'}`}>
              {!isFailed && <Spinner size={16} />}
              {isFailed && <Icon name="alert-triangle" size={16} />}
              <span className={!isFailed ? "animate-pulse" : ""}>{statusText}</span>
            </div>
            <div className="text-ink-400 text-xs space-y-1.5">
              <p className={currentIdx >= 0 ? 'text-teal-400/70' : ''}>{">"} Khởi tạo phiên quét phân tích... {currentIdx >= 1 && '✓'}</p>
              <p className={currentIdx >= 1 ? 'text-teal-400/70' : ''}>{">"} Trích xuất cấu trúc thư mục ({session?.stats?.files || '...'} files)... {currentIdx >= 2 && '✓'}</p>
              {currentIdx >= 1 && <p className={currentIdx >= 2 ? 'text-teal-400/70' : ''}>{">"} Phân tích imports và xây dựng đồ thị... {currentIdx >= 3 && '✓'}</p>}
              {currentIdx >= 2 && <p className={currentIdx >= 3 ? 'text-teal-400/70' : ''}>{">"} Xây dựng architecture graph ({session?.arch?.nodes?.length || '...'} nodes)... {currentIdx >= 3 && '✓'}</p>}
              {currentIdx >= 3 && <p>{">"} Truy vấn Gemini AI để phân tích modules, bảo mật, tours...</p>}
              {isFailed && <p className="text-red-400 mt-2">{">"} LỖI: API từ chối phản hồi hoặc quá tải. Quét thất bại.</p>}
            </div>
            {/* Progress bar */}
            {!isFailed && (
              <div className="mt-2">
                <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(95, (currentIdx + 1) * 25)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

  }
  const stat = (label, value, icon) => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-ink-300 text-[11.5px] uppercase tracking-wide">{label}</span>
        <Icon name={icon} size={13} className="text-ink-300"/>
      </div>
      <div className="font-mono text-ink-50 text-2xl tracking-tight">{value}</div>
    </Card>
  );
  const aiAssessment = session.aiAssessment || DATA.AI_ASSESSMENT;
  const [activeQACat, setActiveQACat] = useState(aiAssessment?.categories?.[0]?.id || 'purpose');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* AI Intelligence Report */}
      {aiAssessment && (
        <Card className="mb-5 overflow-hidden border-teal-500/30">
          <div className="bg-gradient-to-r from-teal-900/40 to-ink-900/40 p-5 border-b border-ink-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="sparkles" size={16} className="text-teal-400"/>
                  <h3 className="text-ink-50 font-medium text-[15px]">AI Intelligence Report</h3>
                </div>
                <p className="text-ink-300 text-[13px]">
                  {ctx.lang === 'vi' ? 'Đánh giá chuyên sâu dựa trên lý luận AI và phân tích mã nguồn tĩnh.' : 'Deep assessment based on AI reasoning and static code analysis.'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-6">
            {/* Contradictions */}
            {aiAssessment.contradictions && aiAssessment.contradictions.map((c, i) => (
              <ContradictionAlert key={i} item={c} t={{ass:{contradiction: 'Contradiction Alert'}}} lang={ctx.lang} />
            ))}

            {/* Beginner Guide (ELI5) */}
            {aiAssessment.beginnerGuide && (
              <BeginnerGuideCard guide={aiAssessment.beginnerGuide} lang={ctx.lang} repoName={session.repo.name} />
            )}

            {/* Q&A List with Tab Categories */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h4 className="text-sm font-medium text-ink-100 flex items-center gap-2">
                  <Icon name="message-square" size={14}/>
                  {ctx.lang === 'vi' ? 'Hỏi đáp chuyên sâu' : 'Deep Q&A'}
                </h4>
                
                <div className="flex items-center gap-1 bg-ink-900/50 p-1 rounded-lg border border-ink-800 overflow-x-auto hide-scrollbar">
                  {aiAssessment.categories?.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveQACat(cat.id)}
                      className={cx(
                        "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap",
                        activeQACat === cat.id ? "bg-ink-700 text-ink-50 shadow-sm" : "text-ink-300 hover:text-ink-100 hover:bg-ink-800/50"
                      )}
                    >
                      {cat.name?.[ctx.lang] || cat.name?.en || cat.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {aiAssessment.categories?.map(cat => (
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
            {aiAssessment.suitability && (
              <div className="flex flex-col md:flex-row gap-4">
                <SuitabilityCard type="good" items={aiAssessment.suitability.goodFor} t={{ass:{goodFor: 'Phù hợp cho', badFor: 'Không phù hợp'}}} lang={ctx.lang} />
                <SuitabilityCard type="bad" items={aiAssessment.suitability.badFor} t={{ass:{goodFor: 'Phù hợp cho', badFor: 'Không phù hợp'}}} lang={ctx.lang} />
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {stat(t.overview.stats.loc, (session.stats.loc || 0).toLocaleString(), 'code-2')}
        {stat(t.overview.stats.files, (session.stats.files || 0).toLocaleString(), 'file')}
        {stat(t.overview.stats.modules, session.stats.modules || 0, 'blocks')}
        {stat(t.overview.stats.contributors, (session.stats.contributors || 0).toLocaleString(), 'user')}
      </div>

      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-ink-50 font-medium">{t.overview.langs}</h3>
          <span className="text-ink-300 text-xs">{session.langs.length} {ctx.lang === 'vi' ? 'ngôn ngữ' : 'languages'}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-ink-700 mb-3">
          {session.langs.map(l => <div key={l.name} style={{ width: l.pct + '%', background: l.color }}/>)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {session.langs.map(l => (
            <div key={l.name} className="flex items-center gap-2 text-[12.5px]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }}/>
              <span className="text-ink-100">{l.name}</span>
              <span className="text-ink-300 ml-auto font-mono">{l.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 mb-5">
        <h3 className="text-ink-50 font-medium mb-3">{t.overview.frameworks}</h3>
        <div className="flex flex-wrap gap-2">
          {(session.frameworks || []).map(f => (
            <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ink-700 border border-ink-600 text-[12.5px] text-ink-50">
              <Icon name="package" size={11} className="text-teal-400"/>{f}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 h-11 border-b border-ink-700">
          <div className="flex items-center gap-2">
            <Icon name="file-text" size={14} className="text-ink-200"/>
            <span className="text-ink-50 font-medium text-[13.5px]">{t.overview.readme}</span>
          </div>
        </div>
        <div className="p-6 prose-readme">
          <Markdown text={session.readme || DATA.README_MD}/>
        </div>
      </Card>
    </div>
  );
}

// ----- Architecture ------------------------------------------------------
export function ArchitectureTab({ 
  ready, session, persona, searchQuery, setSearchQuery, 
  highlightedNodes, setHighlightedNodes, selectedTourStep, setSelectedTourStep 
}) {
  const ctx = useApp(); const t = ctx.t;
  const [selectedNode, setSelectedNode] = useState(null);
  const [isGraphMounted, setIsGraphMounted] = useState(false);

  useEffect(() => { setIsGraphMounted(true); }, []);
  
  const liveArch = session?.arch?.nodes?.length;
  const ARCH_NODES = liveArch ? session.arch.nodes : DATA.ARCH_NODES;
  const ARCH_EDGES = liveArch ? session.arch.edges : DATA.ARCH_EDGES;

  // Path Finder states
  const [pathSource, setPathSource] = useState('');
  const [pathTarget, setPathTarget] = useState('');

  // Update highlighted nodes when searchQuery changes
  useEffect(() => {
    if (!searchQuery) {
      setHighlightedNodes([]);
      return;
    }
    const matches = ARCH_NODES
      .filter(n => n.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   n.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   n.layer?.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(n => n.id);
    setHighlightedNodes(matches);
  }, [searchQuery, ARCH_NODES, setHighlightedNodes]);

  // Update highlighted nodes when path finder inputs change
  useEffect(() => {
    if (!pathSource || !pathTarget) return;
    
    // Simple BFS/DFS pathfinding
    const adj = {};
    ARCH_NODES.forEach(n => { adj[n.id] = []; });
    ARCH_EDGES.forEach(([u, v]) => {
      if (adj[u] && adj[v]) adj[u].push(v);
    });

    const queue = [[pathSource]];
    const visited = new Set([pathSource]);
    let foundPath = null;

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];

      if (node === pathTarget) {
        foundPath = path;
        break;
      }

      for (const neighbor of (adj[node] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    if (foundPath) {
      setHighlightedNodes(foundPath);
    } else {
      setHighlightedNodes([]);
    }
  }, [pathSource, pathTarget, ARCH_NODES, ARCH_EDGES, setHighlightedNodes]);

  if (!ready) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-ink-200 mb-4"><Spinner size={12} className="text-teal-400"/><span className="text-sm">{t.arch.loading}</span></div>
      <Skeleton className="h-[440px] rounded-xl2"/>
    </div>
  );
  
  const layerColor = { frontend:'#60a5fa', backend:'#14B8A6', edge:'#a78bfa', infra:'#f59e0b', tooling:'#94a3b8', data:'#f472b6', docs: '#b08bf5' };
  const nodeMap = Object.fromEntries(ARCH_NODES.map(n => [n.id, n]));

  const activeIncoming = selectedNode ? ARCH_EDGES.filter(e => e[1] === selectedNode.id).map(e => nodeMap[e[0]]?.label || e[0]) : [];
  const activeOutgoing = selectedNode ? ARCH_EDGES.filter(e => e[0] === selectedNode.id).map(e => nodeMap[e[1]]?.label || e[1]) : [];

  return (
    <div className="p-6 max-w-[90rem] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-ink-50 text-lg font-semibold flex items-center gap-2">
            <Icon name="network" size={16} className="text-teal-400" />
            <span>{t.tabs.architecture} (Interactive Graph)</span>
          </h2>
          <p className="text-ink-300 text-[12.5px] mt-0.5">{ctx.lang === 'vi' ? 'Biểu đồ tương tác 2D với dữ liệu từ AST + Gemini.' : 'Interactive 2D force graph powered by AST + Gemini.'}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 h-8 rounded-lg bg-ink-900 border border-ink-700 text-xs">
            <Icon name="search" size={11} className="text-ink-300"/>
            <input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder={ctx.lang === 'vi' ? 'Tìm kiếm node...' : 'Search nodes...'}
              className="bg-transparent border-0 outline-none text-[12px] text-ink-50 placeholder:text-ink-400 w-36"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-ink-400 hover:text-ink-200">
                <Icon name="x" size={9} />
              </button>
            )}
          </div>

          {/* Path Finder */}
          <div className="flex items-center gap-1.5 text-xs bg-ink-900 border border-ink-700 rounded-lg p-1">
            <span className="text-[10px] text-ink-300 uppercase px-1">{ctx.lang === 'vi' ? 'Tìm đường:' : 'Find Path:'}</span>
            <select 
              value={pathSource} 
              onChange={e => setPathSource(e.target.value)} 
              className="bg-ink-800 text-ink-100 border-0 outline-none text-xs rounded px-1.5 py-0.5 max-w-[100px]"
            >
              <option value="">{ctx.lang === 'vi' ? '-- Nguồn --' : '-- Source --'}</option>
              {ARCH_NODES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <Icon name="arrow-right" size={10} className="text-ink-300" />
            <select 
              value={pathTarget} 
              onChange={e => setPathTarget(e.target.value)} 
              className="bg-ink-800 text-ink-100 border-0 outline-none text-xs rounded px-1.5 py-0.5 max-w-[100px]"
            >
              <option value="">{ctx.lang === 'vi' ? '-- Đích --' : '-- Target --'}</option>
              {ARCH_NODES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            {(pathSource || pathTarget) && (
              <button 
                onClick={() => { setPathSource(''); setPathTarget(''); setHighlightedNodes([]); }} 
                className="text-ink-400 hover:text-ink-200 p-0.5"
              >
                <Icon name="x" size={10} />
              </button>
            )}
          </div>

          <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-1"><Icon name="cpu" size={12} className="mr-1"/> AST Graph Engine</Badge>
          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1"><Icon name="sparkles" size={12} className="mr-1"/> AI Semantics</Badge>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
        {/* Graph Area */}
        <Card className="p-0 flex-1 overflow-hidden relative flex flex-col">
          <div className="flex-1 bg-ink-900/40 relative">
             {isGraphMounted && <InteractiveGraph 
                nodes={ARCH_NODES} 
                edges={ARCH_EDGES} 
                layerColor={layerColor}
                onNodeClick={setSelectedNode}
                highlightedNodes={highlightedNodes}
             />}
             {!selectedNode && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="bg-ink-900/80 px-4 py-2 rounded-full border border-ink-700 text-sm text-ink-300 shadow-xl backdrop-blur-sm flex items-center gap-2">
                    <Icon name="mouse-pointer-2" size={14}/>
                    {ctx.lang === 'vi' ? 'Kéo thả và lăn chuột. Click vào một Node để bóc tách chi tiết.' : 'Drag to pan, scroll to zoom. Click a node to view details.'}
                  </div>
                </div>
             )}
          </div>
          <div className="px-5 py-3 border-t border-ink-700 bg-ink-800 flex items-center gap-4 flex-wrap shrink-0">
            <span className="text-[11.5px] text-ink-300 uppercase tracking-wider">{t.arch.legend}</span>
            {Object.entries(layerColor).map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-100">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }}/>{k}
              </span>
            ))}
          </div>
        </Card>

        {/* Info Panel Area */}
        <Card className={`w-full lg:w-96 flex shrink-0 flex-col transition-all duration-300 ${selectedNode ? 'opacity-100 translate-x-0' : 'opacity-50 grayscale pointer-events-none'}`}>
          <div className="p-4 border-b border-ink-700 flex justify-between items-center bg-ink-800">
             <h3 className="font-semibold text-ink-50 truncate flex-1">{selectedNode ? selectedNode.label : 'Select a component'}</h3>
             {selectedNode && (
                <Badge className="bg-ink-700 text-ink-200 border border-ink-600">{selectedNode.layer}</Badge>
             )}
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-5 bg-ink-900/20">
             {selectedNode ? (
               <>
                 <div>
                   <div className="text-[11.5px] text-ink-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Icon name="file-code-2" size={13}/> Metadata</div>
                   <p className="text-sm text-ink-100 bg-ink-900/50 p-3 rounded-lg border border-ink-800 font-mono">{selectedNode.sub}</p>
                 </div>
                 
                 {activeIncoming.length > 0 && (
                   <div>
                     <div className="text-[11.5px] text-ink-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Icon name="arrow-down-right" size={13}/> Imports (Incoming)</div>
                     <div className="flex flex-wrap gap-2">
                       {activeIncoming.map(a => <span key={a} className="text-xs bg-ink-800 border border-ink-700 rounded-md px-2 py-1 text-ink-100">{a}</span>)}
                     </div>
                   </div>
                 )}
                 
                 {activeOutgoing.length > 0 && (
                   <div>
                     <div className="text-[11.5px] text-ink-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Icon name="arrow-top-right" size={13}/> Called by (Outgoing)</div>
                     <div className="flex flex-wrap gap-2">
                       {activeOutgoing.map(a => <span key={a} className="text-xs bg-ink-800 border border-ink-700 rounded-md px-2 py-1 text-ink-100">{a}</span>)}
                     </div>
                   </div>
                 )}
                 <div>
                   <div className="text-[11.5px] text-amber-400/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                     <Icon name="sparkles" size={13}/> 
                     {persona === 'junior' ? (ctx.lang === 'vi' ? 'Giải thích cơ bản' : 'Basic Explanation') :
                      persona === 'pm' ? (ctx.lang === 'vi' ? 'Giá trị dự án' : 'Business Value') :
                      (ctx.lang === 'vi' ? 'AI Business Domain' : 'AI Business Domain')}
                   </div>
                   <div className="text-sm text-amber-100/90 leading-relaxed bg-amber-500/5 p-4 rounded-lg border border-amber-500/10">
                      {persona === 'junior' ? (
                         `${selectedNode.summary || ''}. 
                          ${ctx.lang === 'vi' ? 'Bài học ngôn ngữ: ' : 'Language Lesson: '} 
                          ${selectedNode.type === 'config' ? 
                            (ctx.lang === 'vi' ? 'Tệp cấu hình giúp điều hướng và cài đặt môi trường cho dự án.' : 'Configuration file helps setup environments and paths for the project.') :
                            (ctx.lang === 'vi' ? 'File code nguồn chính chứa các hàm logic thực thi hệ thống.' : 'Main source code file containing execution functions and system logic.')}`
                      ) : persona === 'pm' ? (
                         `${selectedNode.summary || ''}. 
                          ${ctx.lang === 'vi' ? 'Độ phức tạp: ' : 'Complexity: '} ${selectedNode.complexity === 'simple' ? 'Thấp' : selectedNode.complexity === 'moderate' ? 'Trung bình' : 'Cao'}.
                          ${ctx.lang === 'vi' ? 'Rủi ro: ' : 'Risk: '} ${selectedNode.complexity === 'complex' ? 'Cao (Cần giám sát)' : 'Thấp'}`
                      ) : (
                         (session?.modules || []).find(m => m.name.toLowerCase() === selectedNode.label.toLowerCase())?.purpose?.[ctx.lang] || 
                         selectedNode.summary ||
                         (ctx.lang === 'vi' ? 'Quét codebase để hiển thị thông tin nghiệp vụ đầy đủ.' : 'Run full codebase scan to view detailed domain context.')
                      )}
                   </div>
                 </div>
               </>
             ) : (
               <div className="text-sm text-ink-300 text-center mt-10">Select a node to inspect structurally and semantically.</div>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ----- Flow --------------------------------------------------------------
export function FlowTab({ ready }) {
  const ctx = useApp(); const t = ctx.t;
  const [useCase, setUseCase] = useState('login');
  if (!ready) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-ink-200 mb-4"><Spinner size={12} className="text-teal-400"/><span className="text-sm">{t.flow.loading}</span></div>
      <Skeleton className="h-[440px] rounded-xl2"/>
    </div>
  );
  const flow = DATA.FLOWS[useCase];
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
            {Object.entries(DATA.FLOWS).map(([k, v]) => <option key={k} value={k}>{v.name[ctx.lang]}</option>)}
          </select>
        </div>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="bg-ink-900/40 bg-grid p-6 overflow-x-auto">
          <svg width={ACTORS.length * COL + 40} height={TOP + flow.steps.length * ROW + 40}>
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
            {flow.steps.map((s, i) => {
              const fx = 20 + ACTORS.indexOf(s.from) * COL + COL / 2;
              const tx = 20 + ACTORS.indexOf(s.to)   * COL + COL / 2;
              const y = TOP + i * ROW;
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

// ----- Modules -----------------------------------------------------------
export function ModulesTab({ ready, session }) {
  const ctx = useApp(); const t = ctx.t;
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'files', dir: 'desc' });

  if (!ready) return <div className="p-6 max-w-5xl mx-auto space-y-2">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-12"/>)}</div>;

  const source = (session?.modules?.length) ? session.modules : DATA.MODULES;
  let mods = source.filter(m => {
    if (riskFilter !== 'all' && m.risk !== riskFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !(m.purpose?.[ctx.lang] || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  mods = [...mods].sort((a, b) => {
    const k = sort.key;
    let av = a[k], bv = b[k];
    if (k === 'purpose') { av = a.purpose?.[ctx.lang]; bv = b.purpose?.[ctx.lang]; }
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.mod.search}
              className="bg-transparent border-0 outline-none text-[13px] text-ink-50 placeholder:text-ink-300 w-44"/>
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
                <td className="px-3 py-2.5 text-ink-200 text-[13px]">{m.purpose?.[ctx.lang] || '—'}</td>
                <td className="px-3 py-2.5"><LangIcon lang={m.lang} size={14}/></td>
                <td className="px-3 py-2.5 text-right font-mono text-ink-100 text-[13px]">{m.files}</td>
                <td className="px-3 py-2.5 text-right font-mono text-ink-100 text-[13px]">{m.fns}</td>
                <td className="px-3 py-2.5"><RiskChip level={m.risk}/></td>
              </tr>
            ))}
            {mods.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-ink-300">No modules match.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ----- Security ----------------------------------------------------------
export function SecurityTab({ ready, session }) {
  const ctx = useApp(); const t = ctx.t;
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  if (!ready) return <div className="p-6 max-w-5xl mx-auto space-y-3">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-32"/>)}</div>;

  const source = (session?.security?.length)
    ? session.security
    : (session?.id === 'sess-vercel-next' ? DATA.SECURITY_FINDINGS : []);

  if (source.length === 0) return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="p-10 text-center">
        <Icon name="shield" size={28} className="text-teal-400 mx-auto mb-3"/>
        <h3 className="text-ink-50 font-medium mb-1">{t.sec.empty}</h3>
      </Card>
    </div>
  );

  const findings = source.filter(f => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return f.confirmed;
    if (filter === 'fp') return f.falsePositive;
    return f.severity === filter;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-ink-50 text-lg font-semibold">{t.sec.title}</h2>
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
          <Card key={f.id} className={cx('p-0 overflow-hidden',
            f.severity === 'high' && 'border-red-500/30',
            f.severity === 'medium' && 'border-amber-500/25',
            f.falsePositive && 'opacity-70')}>
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="pt-0.5"><Severity level={f.severity}/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-ink-50 font-medium text-[14px]">{f.title?.[ctx.lang] || f.rule}</h3>
                  {f.confirmed && <Badge tone="green"><Icon name="check-circle" size={10}/>{t.sec.confirmed}</Badge>}
                  {!f.confirmed && !f.falsePositive && <Badge tone="amber"><Icon name="bug" size={10}/>{t.sec.heuristic}</Badge>}
                  {f.falsePositive && <Badge tone="slate"><Icon name="x-circle" size={10}/>{t.sec.falsePositive}</Badge>}
                  <Badge tone="slate" className="font-mono">{f.rule}</Badge>
                </div>
                <p className="text-ink-200 text-[13px] mb-2 leading-relaxed">{f.why?.[ctx.lang] || ''}</p>
                <div className="flex items-center gap-3 text-[12px] text-ink-300 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="file-code" size={11}/><span className="text-ink-100">{f.file}</span>:<span className="text-teal-400">{f.line}</span>
                  </span>
                  {(f.refs || []).map(r => <Badge key={r} tone="slate">{r}</Badge>)}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpen(open === f.id ? null : f.id)}>
                <Icon name={open === f.id ? 'chevron-up' : 'sparkles'} size={12}/>
                {t.sec.suggest}
              </Button>
            </div>
            <div className="px-5 pb-4">
              <CodeBlock code={f.code || ''} lang="ts"/>
            </div>
            {open === f.id && f.suggested && !f.falsePositive && (
              <div className="border-t border-ink-700 bg-ink-900/40 px-5 py-4 fade-in">
                <div className="text-[11.5px] uppercase tracking-wider text-ink-300 mb-2">{t.sec.patchPreview}</div>
                <CodeBlock code={f.suggested} lang="ts"/>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ----- Documentation -----------------------------------------------------
export function DocsTab({ ready, session }) {
  const ctx = useApp(); const t = ctx.t;
  const isReal = session?.id && session.id !== 'sess-vercel-next' && session.id !== 'sess-acme-orders';
  const [doc, setDoc] = useState(DATA.GENERATED_DOC);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isReal) { setDoc(DATA.GENERATED_DOC); return; }
    let cancel = false;
    setLoading(true);
    API.docMd(session.id, ctx.lang)
      .then(j => { if (!cancel) setDoc(j.content || ''); })
      .catch(() => {})
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [isReal, session?.id, ctx.lang]);

  const downloadMd = () => {
    const blob = new Blob([doc], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (isReal ? `${session.repo.owner}-${session.repo.name}` : 'next.js') + '.md';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copyMd = () => navigator.clipboard?.writeText(doc);

  if (!ready) return <div className="p-6 max-w-4xl mx-auto"><Skeleton className="h-[600px]"/></div>;
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-ink-50 text-lg font-semibold">{t.doc.generated}</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={downloadMd}><Icon name="download" size={12}/>{t.doc.dlMd}</Button>
          <Button size="sm" variant="outline" onClick={copyMd}><Icon name="copy" size={12}/>Copy</Button>
        </div>
      </div>
      <Card className="p-8">{loading ? <Spinner size={14}/> : <Markdown text={doc}/>}</Card>
    </div>
  );
}

// ----- File Viewer -------------------------------------------------------
export function FileViewer({ file, session }) {
  const isRealSession = session?.id && session.id !== 'sess-vercel-next' && session.id !== 'sess-acme-orders';
  const stub = `// ${file.file}\n// (open this scan with a backend session to view real content)\n`;
  const [code, setCode] = useState(isRealSession ? '' : stub);
  const [loading, setLoading] = useState(isRealSession);
  const [err, setErr] = useState(null);
  const [binary, setBinary] = useState(false);

  useEffect(() => {
    if (!isRealSession) return;
    let cancel = false;
    setLoading(true); setErr(null); setBinary(false);
    API.getFile(session.id, file.file)
      .then(j => { if (cancel) return;
        if (j.binary) { setBinary(true); setCode(''); }
        else setCode(j.content || '');
      })
      .catch(e => { if (!cancel) setErr(String(e.message || e)); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [session?.id, file.file]);

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

// ----- ToursTab (NEW) ----------------------------------------------------
export function ToursTab({ session, ready, selectedTourStep, setSelectedTourStep, setTab, setHighlightedNodes }) {
  const ctx = useApp();
  
  if (!ready) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }
  
  const tours = (session?.tours?.length) ? session.tours : [
    {
      order: 1,
      title: ctx.lang === 'vi' ? '1. Điểm khởi đầu & Cấu hình' : '1. Entry & Config',
      description: {
        vi: 'Bắt đầu từ các tệp tin cấu hình cốt lõi để hiểu cách dự án thiết lập đường dẫn và các thư viện phụ thuộc.',
        en: 'Start from core configurations to understand project setup, dependencies, and environment variables.'
      },
      nodeIds: ['config:package.json']
    },
    {
      order: 2,
      title: ctx.lang === 'vi' ? '2. Giao diện & Định tuyến' : '2. Routing & Interface',
      description: {
        vi: 'Khám phá cách các tệp tin frontend định tuyến và liên kết các trang hiển thị cho người dùng.',
        en: 'Explore how frontend files manage routing and coordinate the main UI displays.'
      },
      nodeIds: ['file:web/app/page.jsx', 'file:web/app/layout.jsx']
    },
    {
      order: 3,
      title: ctx.lang === 'vi' ? '3. Lõi xử lý & API' : '3. Core Logic & API',
      description: {
        vi: 'Nơi chứa các hàm xử lý logic và kết nối tới database hoặc gọi các API dịch vụ bên ngoài.',
        en: 'Where core functions process logic and interact with databases or call external APIs.'
      },
      nodeIds: ['file:web/app/api/scan/route.js', 'file:web/src/lib/analyze.js']
    }
  ];
  
  const handleStepClick = (step) => {
    setSelectedTourStep(step);
    setHighlightedNodes(step.nodeIds || []);
    setTab('architecture');
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-ink-50 text-lg font-semibold mb-1 flex items-center gap-2">
        <Icon name="compass" size={18} className="text-amber-400" />
        {ctx.lang === 'vi' ? 'Hướng dẫn tìm hiểu Codebase (Guided Tours)' : 'Codebase Guided Tours'}
      </h2>
      <p className="text-ink-300 text-sm mb-6">
        {ctx.lang === 'vi' ? 'Học hỏi cấu trúc hệ thống từng bước một theo thứ tự thiết kế của các kỹ sư kiến trúc.' : 'Learn the system structure step-by-step in the architectural design order.'}
      </p>
      
      <div className="grid gap-4">
        {tours.map((step) => {
          const isSelected = selectedTourStep?.order === step.order;
          return (
            <Card 
              key={step.order} 
              className={cx('p-5 cursor-pointer transition-all border hover:border-amber-500/50 hover:bg-ink-900/40', 
                isSelected ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/5' : 'border-ink-700 bg-ink-900/20')}
              onClick={() => handleStepClick(step)}
            >
              <div className="flex items-start gap-4">
                <div className={cx('w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0', 
                  isSelected ? 'bg-amber-500 text-ink-950' : 'bg-ink-800 text-ink-300')}>
                  {step.order}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-ink-50 font-medium text-base mb-1.5">{step.title}</h3>
                  <p className="text-ink-200 text-sm leading-relaxed mb-3">
                    {step.description?.[ctx.lang] || step.description}
                  </p>
                  
                  {step.nodeIds && step.nodeIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-ink-400 font-medium uppercase tracking-wider">
                        {ctx.lang === 'vi' ? 'Thành phần liên quan:' : 'Related components:'}
                      </span>
                      {step.nodeIds.map(nid => (
                        <span key={nid} className="text-xs font-mono bg-ink-800 border border-ink-700 text-ink-100 rounded-md px-2 py-0.5">
                          {nid.split(':').pop()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button size="sm" variant={isSelected ? 'solid' : 'outline'} className="shrink-0 self-center">
                  <Icon name="network" size={12} className="mr-1" />
                  {ctx.lang === 'vi' ? 'Xem trên Graph' : 'View Graph'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
