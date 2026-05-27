import re
with open('web/src/components/pages/ScanTabs.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

new_code = '''export function ArchitectureTab({ ready, session }) {
  const ctx = useApp(); const t = ctx.t;
  const [mode, setMode] = useState('compact');
  const [selectedNode, setSelectedNode] = useState(null);
  const [isGraphMounted, setIsGraphMounted] = useState(false);

  useEffect(() => { setIsGraphMounted(true); }, []);
  
  const liveArch = session?.arch?.nodes?.length;
  const ARCH_NODES = liveArch ? session.arch.nodes : DATA.ARCH_NODES;
  const ARCH_EDGES = liveArch ? session.arch.edges : DATA.ARCH_EDGES;

  if (!ready) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-ink-200 mb-4"><Spinner size={12} className="text-teal-400"/><span className="text-sm">{t.arch.loading}</span></div>
      <Skeleton className="h-[440px] rounded-xl2"/>
    </div>
  );
  
  const layerColor = { frontend:'#60a5fa', backend:'#14B8A6', edge:'#a78bfa', infra:'#f59e0b', tooling:'#94a3b8', data:'#f472b6' };
  const nodeMap = Object.fromEntries(ARCH_NODES.map(n => [n.id, n]));

  const activeIncoming = selectedNode ? ARCH_EDGES.filter(e => e[1] === selectedNode.id).map(e => nodeMap[e[0]]?.label || e[0]) : [];
  const activeOutgoing = selectedNode ? ARCH_EDGES.filter(e => e[0] === selectedNode.id).map(e => nodeMap[e[1]]?.label || e[1]) : [];

  return (
    <div className="p-6 max-w-[90rem] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <div>
          <h2 className="text-ink-50 text-lg font-semibold">{t.tabs.architecture} (Interactive Graph)</h2>
          <p className="text-ink-300 text-[12.5px] mt-0.5">{ctx.lang === 'vi' ? 'Biểu đồ tương tác 2D với dữ liệu từ AST + Gemini.' : 'Interactive 2D force graph powered by AST + Gemini.'}</p>
        </div>
        <div className="flex items-center gap-3">
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
        <Card className={w-full lg:w-96 flex shrink-0 flex-col transition-all duration-300 }>
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
                   <div className="text-[11.5px] text-amber-400/80 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Icon name="sparkles" size={13}/> AI Business Domain</div>
                   <div className="text-sm text-amber-100/90 leading-relaxed bg-amber-500/5 p-4 rounded-lg border border-amber-500/10">
                      {(session?.modules || []).find(m => m.name.toLowerCase() === selectedNode.label.toLowerCase())?.purpose[ctx.lang] || 
                       (ctx.lang === 'vi' ? 'Tiến hành quét và phân tích bằng Gemini để AI gán logic Business Domain cho Node này.' : 'Analyze with Gemini to generate AI business logic summary for this node.')}
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

// ----- Flow -----'''

text = re.sub(r'export function ArchitectureTab\(\{ ready, session \}\) \{.*?\/\/ \-\-\-\-\- Flow \-\-\-\-\-', new_code, text, flags=re.DOTALL)

with open('web/src/components/pages/ScanTabs.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
