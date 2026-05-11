'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/src/context/AppContext';
import Icon from '@/src/components/Icon';
import DATA from '@/src/lib/data';
import cx from '@/src/lib/cx';

export default function CommandPalette({ open, onClose }) {
  const ctx = useApp();
  const t = ctx.t;
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const items = useMemo(() => {
    const nav = [
      { type: 'nav', icon: 'sparkles',  label: ctx.lang === 'vi' ? 'Trang chủ' : 'Home',           to: '/' },
      { type: 'nav', icon: 'briefcase', label: t.nav.library,                                      to: '/library' },
      { type: 'nav', icon: 'swap',      label: ctx.lang === 'vi' ? 'So sánh repo' : 'Compare repos',
        to: '/compare/sess-vercel-next/sess-acme-orders' },
      { type: 'nav', icon: 'settings',  label: t.nav.settings,                                     to: '/settings' },
    ];
    const repos = DATA.LIBRARY.map(r => ({
      type: 'repo', icon: 'github', label: r.name, sub: r.role, to: '/scan/' + r.id, disabled: r.status === 'queued',
    }));
    return [...nav, ...repos];
  }, [ctx.lang, t]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    if (!ql) return items;
    return items.filter(i => (i.label + ' ' + (i.sub || '')).toLowerCase().includes(ql));
  }, [items, q]);

  const choose = (it) => { if (!it || it.disabled) return; ctx.navigate(it.to); onClose(); };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 backdrop flex items-start justify-center pt-[12vh]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-ink-800 border border-ink-700 rounded-xl2 shadow-soft w-[640px] max-w-[92vw] overflow-hidden">
        <div className="flex items-center gap-2 px-3 h-11 border-b border-ink-700">
          <Icon name="search" size={14} className="text-ink-300"/>
          <input ref={inputRef} value={q}
            onChange={e => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
              if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
              if (e.key === 'Enter')     { e.preventDefault(); choose(filtered[active]); }
              if (e.key === 'Escape')    { onClose(); }
            }}
            placeholder={t.cmd.placeholder}
            className="flex-1 bg-transparent outline-none text-ink-50 placeholder:text-ink-300 text-[14px]"/>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-1">
          {filtered.length === 0 && <div className="text-center text-ink-300 text-sm py-6">{t.cmd.empty}</div>}
          {filtered.map((it, i) => (
            <button key={it.to} onClick={() => choose(it)}
              onMouseEnter={() => setActive(i)}
              className={cx('w-full flex items-center gap-2 px-3 py-2 text-left',
                i === active && 'bg-ink-700/50',
                it.disabled && 'opacity-50')}>
              <Icon name={it.icon} size={14} className="text-ink-200"/>
              <span className="text-ink-50 text-[13.5px]">{it.label}</span>
              {it.sub && <span className="text-ink-300 text-[11.5px] ml-1">{it.sub}</span>}
              <span className="ml-auto text-ink-400 text-[11.5px] font-mono">{it.to}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
