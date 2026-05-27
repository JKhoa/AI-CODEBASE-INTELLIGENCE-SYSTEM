// Library page (/library) — list of indexed repos with filter/sort.
function LibraryPage({ ctx }) {
  const t = ctx.t;
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [remote, setRemote] = React.useState([]);

  React.useEffect(() => {
    let stop = false;
    const tick = async () => {
      const live = await window.API.probe();
      if (!live || stop) return;
      try {
        const j = await window.API.listLibrary();
        if (!stop) setRemote(j.items || []);
      } catch (_) { /* ignore */ }
    };
    tick();
    const tm = setInterval(tick, 4000);
    return () => { stop = true; clearInterval(tm); };
  }, []);

  // Merge remote sessions on top, keep mock demos visible (de-duped by name)
  const seen = new Set(remote.map(r => r.name));
  const repos = [...remote, ...window.DATA.LIBRARY.filter(r => !seen.has(r.name))];

  const filtered = repos.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusBadge = (s) => {
    if (s === 'ready')    return <Badge tone="teal"><Icon name="check-circle" size={10}/>ready</Badge>;
    if (s === 'scanning') return <Badge tone="amber"><Spinner size={10}/>scanning</Badge>;
    if (s === 'queued')   return <Badge tone="slate"><Icon name="clock" size={10}/>queued</Badge>;
    return <Badge tone="slate">{s}</Badge>;
  };

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-50 mb-1">{t.library.title}</h1>
          <p className="text-ink-200">{t.library.subtitle}</p>
        </div>
        <Button variant="primary" onClick={() => ctx.navigate('/')}>
          <Icon name="plus" size={14}/> {t.library.addNew}
        </Button>
      </div>

      <Card className="p-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 px-3 h-9 rounded-lg bg-ink-900 border border-ink-700">
            <Icon name="search" size={14} className="text-ink-300"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.common.search} className="flex-1 bg-transparent outline-none text-sm text-ink-50 placeholder:text-ink-300" />
          </div>
          <SegControl value={filter} onChange={setFilter} options={[
            { value: 'all',      label: t.mod.filterAll },
            { value: 'ready',    label: 'Ready' },
            { value: 'scanning', label: 'Scanning' },
            { value: 'queued',   label: 'Queued' },
          ]}/>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-300 text-[11.5px] uppercase tracking-wide border-b border-ink-700">
              <th className="text-left font-medium px-4 py-2.5">{t.library.cols.name}</th>
              <th className="text-left font-medium px-4 py-2.5">{t.library.cols.status}</th>
              <th className="text-right font-medium px-4 py-2.5">{t.library.cols.loc}</th>
              <th className="text-left font-medium px-4 py-2.5">{t.library.cols.langs}</th>
              <th className="text-left font-medium px-4 py-2.5">{t.library.cols.last}</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-ink-700/60 hover:bg-ink-700/30 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Icon name="github" size={16} className="text-ink-200"/>
                    <button onClick={() => r.status !== 'queued' && ctx.navigate('/scan/' + r.id)} className="font-mono text-ink-50 hover:text-teal-400 text-sm">{r.name}</button>
                    <Badge tone="slate" className="ml-1">{r.role}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3 text-right font-mono text-ink-100 text-[13px]">{r.loc.toLocaleString()}</td>
                <td className="px-4 py-3"><div className="flex gap-1.5">{r.langs.map(l => <LangIcon key={l} lang={l} size={16}/>)}</div></td>
                <td className="px-4 py-3 text-ink-200 text-[13px]">{r.lastScan}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip text={ctx.lang === 'vi' ? 'So sánh với…' : 'Compare with…'}><Button size="iconSm" variant="ghost" onClick={() => ctx.navigate('/compare/' + r.id + '/sess-acme-orders')}><Icon name="swap" size={13}/></Button></Tooltip>
                    <Tooltip text={t.common.open}><Button size="iconSm" variant="ghost" onClick={() => r.status !== 'queued' && ctx.navigate('/scan/' + r.id)}><Icon name="arrow-up-right" size={13}/></Button></Tooltip>
                    <Tooltip text="More"><Button size="iconSm" variant="ghost"><Icon name="more-horizontal" size={13}/></Button></Tooltip>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-ink-300">{t.library.empty}</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

window.LibraryPage = LibraryPage;
