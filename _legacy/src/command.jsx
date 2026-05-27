// Command palette (⌘K) — search across navigation, repos, actions.
function CommandPalette({ ctx, open, onClose }) {
  const t = ctx.t;
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef(null);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setQ(''); setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const items = React.useMemo(() => {
    const nav = [
      { type: 'nav', icon: 'sparkles',     label: ctx.lang === 'vi' ? 'Trang chủ' : 'Home',       to: '/' },
      { type: 'nav', icon: 'briefcase',    label: t.nav.library,                                    to: '/library' },
      { type: 'nav', icon: 'swap',         label: ctx.lang === 'vi' ? 'So sánh repo' : 'Compare repos', to: '/compare/sess-vercel-next/sess-acme-orders' },
      { type: 'nav', icon: 'settings',     label: t.nav.settings,                                   to: '/settings' },
    ];
    const repos = window.DATA.LIBRARY.map(r => ({
      type: 'repo', icon: 'github', label: r.name, sub: r.role, to: '/scan/' + r.id, disabled: r.status === 'queued'
    }));
    const actions = [
      { type: 'action', icon: 'plus', label: ctx.lang === 'vi' ? 'Quét repo mới' : 'Scan new repo', shortcut: '⌘N', run: () => ctx.navigate('/') },
      { type: 'action', icon: ctx.theme === 'dark' ? 'sun' : 'moon', label: ctx.lang === 'vi' ? 'Đổi giao diện' : 'Toggle theme', shortcut: '⌘T', run: () => ctx.setTheme(ctx.theme === 'dark' ? 'light' : 'dark') },
      { type: 'action', icon: 'languages', label: ctx.lang === 'vi' ? 'Đổi ngôn ngữ' : 'Toggle language', shortcut: '⌘L', run: () => ctx.setLang(ctx.lang === 'vi' ? 'en' : 'vi') },
      { type: 'action', icon: ctx.mode === 'cloud' ? 'server' : 'cloud', label: ctx.lang === 'vi' ? 'Chuyển Cloud/Local' : 'Toggle Cloud/Local', shortcut: '⌘M', run: () => ctx.setMode(ctx.mode === 'cloud' ? 'local' : 'cloud') },
    ];
    return [
      { section: t.cmd.sec.nav,     entries: nav },
      { section: t.cmd.sec.actions, entries: actions },
      { section: t.cmd.sec.repos,   entries: repos },
    ];
  }, [ctx.lang, ctx.theme, ctx.mode]);

  const flat = [];
  const filtered = items.map(group => {
    const matches = group.entries.filter(e => !q || (e.label + (e.sub || '')).toLowerCase().includes(q.toLowerCase()));
    matches.forEach(m => flat.push({ ...m, _group: group.section }));
    return { section: group.section, entries: matches };
  }).filter(g => g.entries.length > 0);

  React.useEffect(() => { setActive(0); }, [q]);

  const run = (it) => {
    if (it.disabled) return;
    if (it.run) it.run();
    if (it.to) ctx.navigate(it.to);
    onClose();
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(flat.length - 1, a + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); flat[active] && run(flat[active]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, active, flat]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] backdrop flex items-start justify-center pt-[12vh] fade-in" onClick={onClose}>
      <div className="w-full max-w-xl mx-4 bg-ink-800 border border-ink-600 rounded-xl shadow-soft overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 h-12 border-b border-ink-700">
          <Icon name="search" size={15} className="text-ink-300"/>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t.cmd.placeholder}
            className="flex-1 bg-transparent outline-none text-[14px] text-ink-50 placeholder:text-ink-300"
          />
          <Kbd>esc</Kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-1.5">
          {filtered.length === 0 && <div className="text-center py-8 text-ink-300 text-sm">{t.cmd.empty}</div>}
          {filtered.map((g, gi) => (
            <div key={gi}>
              <div className="px-3 pt-2 pb-1 text-[10.5px] uppercase tracking-wider text-ink-300">{g.section}</div>
              {g.entries.map((e, ei) => {
                const idx = flat.findIndex(f => f === flat.find(fl => fl.label === e.label && fl._group === g.section));
                const isActive = flat[active] && flat[active].label === e.label && flat[active]._group === g.section;
                return (
                  <button
                    key={ei}
                    disabled={e.disabled}
                    onMouseEnter={() => { const i = flat.findIndex(f => f.label === e.label && f._group === g.section); if (i >= 0) setActive(i); }}
                    onClick={() => run(e)}
                    className={cx(
                      'w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-sm text-left transition-colors',
                      isActive ? 'bg-teal-500/10 text-ink-50' : 'text-ink-100 hover:bg-ink-700',
                      e.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Icon name={e.icon} size={14} className={isActive ? 'text-teal-400' : 'text-ink-200'}/>
                    <span className="flex-1 truncate">{e.label}</span>
                    {e.sub && <span className="text-ink-300 text-xs">{e.sub}</span>}
                    {e.shortcut && <Kbd>{e.shortcut}</Kbd>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-ink-700 text-[11px] text-ink-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
            <span className="flex items-center gap-1"><Kbd>↵</Kbd> select</span>
          </div>
          <span className="font-mono">cmdk</span>
        </div>
      </div>
    </div>
  );
}

window.CommandPalette = CommandPalette;
