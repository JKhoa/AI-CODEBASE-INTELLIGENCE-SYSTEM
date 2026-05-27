// App shell — top nav, hash router, language/theme/mode context, command palette mount.
const { useState, useEffect, useCallback } = React;

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const path = hash.replace(/^#/, '') || '/';
  const segs = path.split('/').filter(Boolean);
  let route = 'landing', params = {};
  if (segs.length === 0) route = 'landing';
  else if (segs[0] === 'scan') { route = 'scan'; params.sessionId = segs[1] || ''; }
  else if (segs[0] === 'library') route = 'library';
  else if (segs[0] === 'compare') { route = 'compare'; params.a = segs[1]; params.b = segs[2]; }
  else if (segs[0] === 'settings') route = 'settings';

  const navigate = useCallback((to) => { window.location.hash = '#' + to; }, []);
  return { route, params, path, navigate };
}

function App() {
  const { route, params, path, navigate } = useHashRoute();

  const [lang, setLang]   = useState(() => localStorage.getItem('lang')  || 'vi');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [mode, setMode]   = useState(() => localStorage.getItem('mode')  || 'cloud');
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => { localStorage.setItem('lang',  lang);  document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (theme === 'light') {
      document.body.style.background = '#F6F7F9';
      document.body.style.color = '#0E1116';
    } else {
      document.body.style.background = '#0B0D10';
      document.body.style.color = '#C9CFDB';
    }
  }, [theme]);
  useEffect(() => { localStorage.setItem('mode',  mode); }, [mode]);

  // Global ⌘K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const t = window.I18N[lang];
  const ctx = { t, lang, setLang, theme, setTheme, mode, setMode, navigate, route, params, path };

  const isFullBleed = route === 'scan';

  return (
    <div className={cx('h-full flex flex-col', theme === 'light' && 'bg-[#F6F7F9] text-[#0E1116]')}>
      <TopBar ctx={ctx} onOpenCmd={() => setCmdOpen(true)}/>
      <main className={cx('flex-1 min-h-0', isFullBleed ? 'overflow-hidden' : 'overflow-y-auto')}>
        {route === 'landing'  && <LandingPage  ctx={ctx}/>}
        {route === 'scan'     && <ScanPage     ctx={ctx} params={params}/>}
        {route === 'library'  && <LibraryPage  ctx={ctx}/>}
        {route === 'compare'  && <ComparePage  ctx={ctx} params={params}/>}
        {route === 'settings' && <SettingsPage ctx={ctx}/>}
      </main>
      <CommandPalette ctx={ctx} open={cmdOpen} onClose={() => setCmdOpen(false)}/>
    </div>
  );
}

function TopBar({ ctx, onOpenCmd }) {
  const t = ctx.t;
  const at = (p) => ctx.path === p || (p !== '/' && ctx.path.startsWith(p));
  return (
    <header className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center h-12 px-4 gap-3">
        {/* Logo */}
        <button onClick={() => ctx.navigate('/')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/40 inline-flex items-center justify-center relative">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M4 7l8-4 8 4-8 4-8-4z" fill="#14B8A6" opacity=".95"/>
              <path d="M4 12l8 4 8-4" stroke="#14B8A6" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
              <path d="M4 17l8 4 8-4" stroke="#2DD4BF" strokeWidth="1.6" fill="none" strokeLinejoin="round" opacity=".7"/>
            </svg>
          </div>
          <span className="font-semibold text-ink-50 tracking-tight text-[14px] hidden sm:block">{t.appName}</span>
        </button>

        <span className="text-ink-500">/</span>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          <NavLink active={at('/')} onClick={() => ctx.navigate('/')} icon="sparkles" label={ctx.lang === 'vi' ? 'Trang chủ' : 'Home'}/>
          <NavLink active={at('/library')} onClick={() => ctx.navigate('/library')} icon="briefcase" label={t.nav.library}/>
        </nav>

        {/* Search / cmdK */}
        <button onClick={onOpenCmd} className="ml-auto inline-flex items-center gap-2 px-2.5 h-8 rounded-lg bg-ink-800 border border-ink-700 hover:border-ink-600 text-ink-300 text-[12.5px] min-w-[200px]">
          <Icon name="search" size={13}/>
          <span className="flex-1 text-left">{t.common.search}</span>
          <Kbd>⌘K</Kbd>
        </button>

        {/* Mode mini */}
        <Tooltip text={ctx.mode === 'cloud' ? t.cloud : t.local}>
          <button onClick={() => ctx.setMode(ctx.mode === 'cloud' ? 'local' : 'cloud')} className={cx(
            'inline-flex items-center gap-1.5 px-2 h-8 rounded-lg border text-[12px] font-medium',
            ctx.mode === 'cloud' ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' : 'bg-violet-500/10 border-violet-500/30 text-violet-300',
          )}>
            <Icon name={ctx.mode === 'cloud' ? 'cloud' : 'server'} size={12}/>
            <span className="hidden md:inline">{ctx.mode === 'cloud' ? 'Cloud' : 'Local'}</span>
          </button>
        </Tooltip>

        {/* Lang */}
        <Tooltip text={ctx.lang === 'vi' ? 'Đổi sang English' : 'Switch to Vietnamese'}>
          <button onClick={() => ctx.setLang(ctx.lang === 'vi' ? 'en' : 'vi')} className="inline-flex items-center gap-1 px-2 h-8 rounded-lg border border-ink-700 hover:border-ink-600 text-ink-200 text-[12px] font-medium">
            <Icon name="languages" size={12}/>
            <span>{ctx.lang.toUpperCase()}</span>
          </button>
        </Tooltip>

        {/* Theme */}
        <Tooltip text={ctx.theme === 'dark' ? 'Light' : 'Dark'}>
          <button onClick={() => ctx.setTheme(ctx.theme === 'dark' ? 'light' : 'dark')} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-ink-700 hover:border-ink-600 text-ink-200">
            <Icon name={ctx.theme === 'dark' ? 'sun' : 'moon'} size={13}/>
          </button>
        </Tooltip>

        {/* Settings */}
        <Tooltip text={t.nav.settings}>
          <button onClick={() => ctx.navigate('/settings')} className={cx(
            'inline-flex items-center justify-center w-8 h-8 rounded-lg border hover:border-ink-600 text-ink-200',
            at('/settings') ? 'bg-ink-700 border-ink-500 text-ink-50' : 'border-ink-700'
          )}>
            <Icon name="settings" size={13}/>
          </button>
        </Tooltip>
      </div>
    </header>
  );
}

function NavLink({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={cx(
      'inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[13px] font-medium transition-colors',
      active ? 'bg-ink-700 text-ink-50' : 'text-ink-200 hover:text-ink-50 hover:bg-ink-800'
    )}>
      <Icon name={icon} size={13}/>
      <span>{label}</span>
    </button>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
