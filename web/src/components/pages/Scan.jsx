'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/src/context/AppContext';
import Icon from '@/src/components/Icon';
import { Button, Badge, Skeleton, Spinner, Tooltip, LangIcon } from '@/src/components/ui';
import API, { adaptSessionForUI } from '@/src/lib/api';
import DATA from '@/src/lib/data';
import cx from '@/src/lib/cx';
import {
  OverviewTab, ArchitectureTab, ToursTab, FlowTab, ModulesTab, SecurityTab, DocsTab, FileViewer,
} from './ScanTabs';
import AssistantPanel from './Assistant';

const STAGE_DURATIONS = { cloning: 2400, parsing: 4200, indexing: 5400, summarizing: 3000 };

export default function Scan({ sessionId }) {
  const ctx = useApp(); const t = ctx.t;
  const sid = sessionId;
  const isMock = sid === 'sess-acme-orders' || sid === 'sess-vercel-next';
  const isLive = sid === 'sess-acme-orders';

  const [remote, setRemote] = useState(null);

  const sp = useSearchParams();

  useEffect(() => {
    if (isMock) return;

    if (sid === 'new') {
      const url = sp?.get('url');
      const wsId = sp?.get('workspaceId');
      if (!url) return;

      let stopped = false;
      const startStream = async () => {
        setRemote({
          id: sid, status: 'scanning', stage: 'cloning',
          repo: { owner: '...', name: '...', branch: 'main', url: '', stars: 0, forks: 0, desc: { vi: '', en: '' } },
          stats: { loc: 0, files: 0, modules: 0, contributors: 0 },
          langs: [], tree: [], arch: { nodes: [], edges: [] }, modules: [], security: [], tours: [], domains: [], readme: '', frameworks: []
        });

        try {
          await API.scanStream({ url, workspaceId: wsId, token: null }, (data) => {
            if (stopped) return;
            if (data.stage === 'ready' && data.scanId) {
              ctx.navigate('/scan/' + data.scanId);
            } else if (data.stage === 'failed') {
              setRemote({ id: sid, status: 'failed', stage: 'failed' });
            } else if (data.stage) {
              setRemote(prev => ({
                ...(prev || {}),
                id: sid,
                status: 'scanning',
                stage: data.stage,
                ...(data.tree && { tree: data.tree }),
                ...(data.langs && { langs: data.langs }),
                ...(data.arch && { arch: data.arch }),
                ...(data.stats && { stats: data.stats }),
                ...(data.repo && { repo: data.repo }),
                ...(data.aiAssessment && { aiAssessment: data.aiAssessment })
              }));
            }
          });
        } catch (e) {
          if (!stopped) setRemote({ id: sid, status: 'failed', stage: 'failed' });
        }
      };
      
      startStream();
      return () => { stopped = true; };
    }

    // Normal polling for existing scan
    let stopped = false; let timer = null; let errorCount = 0;
    const tick = async () => {
      try {
        const raw = await API.getScan(sid);
        errorCount = 0; // reset on success
        if (stopped) return;
        // Safely adapt — raw may have partial data during scanning
        try {
          const adapted = adaptSessionForUI(raw);
          setRemote(adapted);
        } catch {
          // Partial data, just store what we have
          setRemote({
            id: sid, status: raw?.status || 'scanning',
            stage: raw?.stage || 'cloning',
            repo: raw?.repo || { owner: '...', name: '...', branch: 'main', url: '', stars: 0, forks: 0, desc: { vi: '', en: '' } },
            stats: raw?.stats || { loc: 0, files: 0, modules: 0, contributors: 0 },
            langs: raw?.langs || [], tree: raw?.tree || [],
            arch: raw?.arch || { nodes: [], edges: [] },
            modules: raw?.modules || [], security: raw?.security || [],
            tours: raw?.tours || [], domains: raw?.domains || [],
            readme: raw?.readme || '', frameworks: [],
            aiAssessment: raw?.aiAssessment || null,
          });
        }
        if (raw?.status === 'done' || raw?.status === 'failed' || raw?.stage === 'ready') return;
        timer = setTimeout(tick, 2000);
      } catch (e) {
        errorCount++;
        if (errorCount > 3) {
          console.error("Scan fetch failed 3 times, marking as failed:", e);
          setRemote({ id: sid, status: 'failed', stage: 'failed' });
          return;
        }
        if (!stopped) timer = setTimeout(tick, 3000);
      }
    };
    tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [sid, isMock]);

  const session = remote || (isLive ? DATA.SCAN_LIVE : DATA.SCAN_DONE);

  // Map real backend stage from data.stage field or status
  const [stage, setStage] = useState(isMock ? (isLive ? 'cloning' : 'ready') : 'cloning');
  useEffect(() => {
    if (!isMock) {
      if (remote?.status === 'failed') { setStage('failed'); return; }
      if (remote?.status === 'done') { setStage('ready'); return; }
      // Read real stage from backend data
      const backendStage = remote?.stage;
      if (backendStage) {
        setStage(backendStage);
      }
      return;
    }
    if (!isLive || stage === 'ready') return;
    const order = ['cloning', 'parsing', 'indexing', 'summarizing', 'ready'];
    const next = order[order.indexOf(stage) + 1];
    const tm = setTimeout(() => setStage(next), STAGE_DURATIONS[stage] || 2000);
    return () => clearTimeout(tm);
  }, [stage, isLive, isMock, remote]);

  const [leftW, setLeftW]   = useState(240);
  const [rightW, setRightW] = useState(380);
  useEffect(() => {
    setLeftW(+localStorage.getItem('cw:left')  || 240);
    setRightW(+localStorage.getItem('cw:right') || 380);
  }, []);
  useEffect(() => { localStorage.setItem('cw:left', leftW); }, [leftW]);
  useEffect(() => { localStorage.setItem('cw:right', rightW); }, [rightW]);

  const [tab, setTab] = useState('overview');
  const [openFile, setOpenFile] = useState(null);
  
  // Custom states inspired by Understand-Anything
  const [persona, setPersona] = useState('power');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [selectedTourStep, setSelectedTourStep] = useState(null);

  const stageIdx = ['cloning','parsing','indexing','summarizing','ready'].indexOf(stage);
  const treeReady = stageIdx >= 1, dataReady = stageIdx >= 2, archReady = stageIdx >= 3;
  const ready = stage === 'ready';

  return (
    <div className="h-full flex flex-col bg-ink-950 text-ink-50">
      <div className="border-b border-ink-700 bg-ink-900/40 px-4 h-12 flex items-center gap-3 flex-shrink-0">
        <Icon name="github" size={15} className="text-ink-200"/>
        <span className="font-mono text-ink-50 text-[13.5px]">{session.repo.owner}/{session.repo.name}</span>
        <Badge tone="slate"><Icon name="git-branch" size={10}/>{session.repo.branch}</Badge>
        {session.repo.commit && <Badge tone="slate" className="font-mono">{session.repo.commit}</Badge>}
        <span className="hidden md:inline text-ink-300 text-[12.5px] truncate max-w-[30%]">{session.repo.desc?.[ctx.lang] || ''}</span>
        
        <div className="ml-auto flex items-center gap-3">
          {/* Persona Selector */}
          <div className="flex items-center bg-ink-800 rounded-lg p-0.5 border border-ink-700 text-xs">
            <button
              onClick={() => setPersona('junior')}
              className={cx('px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1', 
                persona === 'junior' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-ink-300 hover:text-ink-100')}
              title={ctx.lang === 'vi' ? 'Lập trình viên tập sự' : 'Junior Developer'}
            >
              <Icon name="user" size={11} />
              <span>{ctx.lang === 'vi' ? 'Junior' : 'Junior'}</span>
            </button>
            <button
              onClick={() => setPersona('pm')}
              className={cx('px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1', 
                persona === 'pm' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-ink-300 hover:text-ink-100')}
              title={ctx.lang === 'vi' ? 'Quản lý dự án' : 'Project Manager'}
            >
              <Icon name="briefcase" size={11} />
              <span>{ctx.lang === 'vi' ? 'PM' : 'PM'}</span>
            </button>
            <button
              onClick={() => setPersona('power')}
              className={cx('px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1', 
                persona === 'power' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-ink-300 hover:text-ink-100')}
              title={ctx.lang === 'vi' ? 'Chuyên gia' : 'Power User'}
            >
              <Icon name="cpu" size={11} />
              <span>{ctx.lang === 'vi' ? 'Power' : 'Power'}</span>
            </button>
          </div>

          <Button size="sm" variant="outline" as="a" href={session.repo.url} target="_blank" rel="noreferrer">
            <Icon name="external-link" size={12}/> GitHub
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-shrink-0 border-r border-ink-700 bg-ink-900/40 overflow-y-auto" style={{ width: leftW }}>
          <ProjectTree ready={treeReady} session={session}
            onOpen={(f) => { setOpenFile(f); setTab('file'); }}/>
        </div>
        <Resizer onResize={(dx) => setLeftW(w => Math.max(180, Math.min(380, w + dx)))}/>
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <Workspace tab={tab} setTab={setTab} session={session} ready={ready} stage={stage}
            dataReady={dataReady} archReady={archReady}
            openFile={openFile} setOpenFile={setOpenFile}
            persona={persona} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            highlightedNodes={highlightedNodes} setHighlightedNodes={setHighlightedNodes}
            selectedTourStep={selectedTourStep} setSelectedTourStep={setSelectedTourStep}/>
        </div>
        <Resizer onResize={(dx) => setRightW(w => Math.max(320, Math.min(560, w - dx)))}/>
        <div className="flex-shrink-0 border-l border-ink-700 bg-ink-900/40" style={{ width: rightW }}>
          <AssistantPanel session={session} stage={stage} ready={ready}
            onOpenFile={(f) => { setOpenFile(f); setTab('file'); }}/>
        </div>
      </div>
    </div>
  );
}

function Resizer({ onResize }) {
  const dragging = useRef(false);
  const lastX = useRef(0);
  const [drag, setDrag] = useState(false);
  const onDown = (e) => { dragging.current = true; lastX.current = e.clientX; setDrag(true); document.body.style.cursor = 'col-resize'; };
  useEffect(() => {
    const onMove = (e) => { if (!dragging.current) return; const dx = e.clientX - lastX.current; lastX.current = e.clientX; onResize(dx); };
    const onUp = () => { dragging.current = false; setDrag(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onResize]);
  return <div className={cx('resizer', drag && 'dragging')} onMouseDown={onDown}/>;
}

function ProjectTree({ ready, session, onOpen }) {
  const ctx = useApp(); const t = ctx.t;
  const treeData = (session?.tree?.length) ? session.tree : DATA.FILE_TREE;
  if (!ready) return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2 text-[11.5px] text-ink-300 uppercase tracking-wider px-1.5">
        <Spinner size={11} className="text-teal-400"/>
        <span>{ctx.lang === 'vi' ? 'Đang đọc cây thư mục…' : 'Reading file tree…'}</span>
      </div>
      {Array.from({length:14}).map((_,i)=>
        <div key={i} className="flex items-center gap-2 px-1.5">
          <Skeleton className="h-3.5" style={{width:12}}/>
          <Skeleton className="h-3.5" style={{width:`${30+(i*7)%50}%`}}/>
        </div>
      )}
    </div>
  );
  return (
    <div className="py-2">
      <div className="px-3 mb-2 flex items-center justify-between">
        <span className="text-[11.5px] text-ink-300 uppercase tracking-wider">{t.common.tree}</span>
      </div>
      <div className="text-[13px] font-mono pb-3">
        {treeData.map((n, i) => <TreeNode key={n.path || n.name + i} node={n} depth={0} onOpen={onOpen}/>)}
      </div>
    </div>
  );
}

function TreeNode({ node, depth, onOpen }) {
  const ctx = useApp();
  const [open, setOpen] = useState(node.expanded === true);
  const indent = 8 + depth * 12;
  if (node.type === 'dir') {
    return (
      <div className="tree-row">
        <button onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-1.5 hover:bg-ink-700/60 py-0.5 text-left"
          style={{ paddingLeft: indent }}>
          <Icon name="chevron-right" size={11} className={cx('text-ink-300 transition-transform', open && 'rotate-90')}/>
          <Icon name={open ? 'folder-open' : 'folder'} size={13} className="text-amber-400/80"/>
          <span className="text-ink-100">{node.name}</span>
        </button>
        {open && node.children?.map((c, i) => <TreeNode key={c.path || c.name + i} node={c} depth={depth + 1} onOpen={onOpen}/>)}
      </div>
    );
  }
  return (
    <Tooltip text={node.role ? node.role[ctx.lang] : node.name} side="right">
      <button
        onClick={() => onOpen({ file: node.path || node.name, lang: node.lang, loc: node.loc, size: node.size })}
        className="w-full flex items-center gap-1.5 hover:bg-ink-700/60 py-0.5 text-left tree-row"
        style={{ paddingLeft: indent + 14 }}>
        <LangIcon lang={node.lang} size={12}/>
        <span className="text-ink-200 truncate flex-1">{node.name}</span>
        {node.loc && <span className="text-ink-300 text-[11px] mr-2">{node.loc}</span>}
      </button>
    </Tooltip>
  );
}

function Workspace({ 
  tab, setTab, session, ready, stage, dataReady, archReady, openFile, setOpenFile,
  persona, searchQuery, setSearchQuery, highlightedNodes, setHighlightedNodes,
  selectedTourStep, setSelectedTourStep
}) {
  const ctx = useApp(); const t = ctx.t;
  const TABS = [
    { id: 'overview',      label: t.tabs.overview,      icon: 'gauge' },
    { id: 'architecture',  label: t.tabs.architecture,  icon: 'network' },
    { id: 'tours',         label: ctx.lang === 'vi' ? 'Hướng dẫn' : 'Guided Tours', icon: 'book-open' },
    { id: 'flow',          label: t.tabs.flow,          icon: 'workflow' },
    { id: 'modules',       label: t.tabs.modules,       icon: 'blocks' },
    { id: 'security',      label: t.tabs.security,      icon: 'shield' },
    { id: 'documentation', label: t.tabs.documentation, icon: 'book-open' },
  ];
  return (
    <>
      <div className="border-b border-ink-700 bg-ink-900/40 flex-shrink-0 px-2 flex items-end overflow-x-auto">
        {TABS.map(tt => (
          <button key={tt.id} onClick={() => setTab(tt.id)}
            className={cx('relative inline-flex items-center gap-1.5 px-3 h-10 text-[13px] font-medium whitespace-nowrap transition-colors',
              tab === tt.id ? 'tab-active' : 'text-ink-200 hover:text-ink-100')}>
            <Icon name={tt.icon} size={13}/>
            <span>{tt.label}</span>
          </button>
        ))}
        {tab === 'file' && openFile && (
          <button className="relative inline-flex items-center gap-1.5 px-3 h-10 text-[13px] font-medium tab-active">
            <Icon name="file-code" size={13}/>
            <span className="font-mono">{openFile.file}</span>
            <span className="ml-1 hover:text-red-400 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setOpenFile(null); setTab('overview'); }}>
              <Icon name="x" size={12}/>
            </span>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-ink-950">
        {tab === 'overview'      && <OverviewTab     session={session} ready={dataReady} stage={stage}/>}
        {tab === 'architecture'  && <ArchitectureTab session={session} ready={archReady}
          persona={persona} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          highlightedNodes={highlightedNodes} setHighlightedNodes={setHighlightedNodes}
          selectedTourStep={selectedTourStep} setSelectedTourStep={setSelectedTourStep}/>}
        {tab === 'tours'         && <ToursTab        session={session} ready={ready}
          selectedTourStep={selectedTourStep} setSelectedTourStep={setSelectedTourStep}
          setTab={setTab} setHighlightedNodes={setHighlightedNodes}/>}
        {tab === 'flow'          && <FlowTab         ready={archReady}/>}
        {tab === 'modules'       && <ModulesTab      session={session} ready={dataReady}/>}
        {tab === 'security'      && <SecurityTab     session={session} ready={ready}/>}
        {tab === 'documentation' && <DocsTab         session={session} ready={ready}/>}
        {tab === 'file' && openFile && <FileViewer file={openFile} session={session}/>}
      </div>
    </>
  );
}
