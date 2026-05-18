'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/src/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import Icon from '@/src/components/Icon';
import { Tooltip, Kbd, Badge } from '@/src/components/ui';
import cx from '@/src/lib/cx';

export default function TopBar({ onOpenCmd }) {
  const ctx = useApp();
  const auth = useAuth();
  const t = ctx.t;
  const at = (p) => ctx.path === p || (p !== '/' && ctx.path.startsWith(p));

  return (
    <header className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center h-12 px-4 gap-3">
        <button onClick={() => ctx.navigate(auth.user ? '/dashboard' : '/')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/40 inline-flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M4 7l8-4 8 4-8 4-8-4z" fill="#14B8A6" opacity=".95"/>
              <path d="M4 12l8 4 8-4" stroke="#14B8A6" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
              <path d="M4 17l8 4 8-4" stroke="#2DD4BF" strokeWidth="1.6" fill="none" strokeLinejoin="round" opacity=".7"/>
            </svg>
          </div>
          <span className="font-semibold text-ink-50 tracking-tight text-[14px] hidden sm:block">{t.appName}</span>
        </button>

        <span className="text-ink-500">/</span>

        <nav className="flex items-center gap-0.5">
          {auth.user ? (
            <>
              <NavLink active={at('/dashboard')} onClick={() => ctx.navigate('/dashboard')} icon="sparkles" label="Dashboard"/>
              <NavLink active={at('/')}          onClick={() => ctx.navigate('/')}          icon="github"   label={ctx.lang === 'vi' ? 'Quét repo' : 'Scan'}/>
              <NavLink active={at('/library')}   onClick={() => ctx.navigate('/library')}   icon="briefcase" label={t.nav.library}/>
            </>
          ) : (
            <>
              <NavLink active={at('/')}        onClick={() => ctx.navigate('/')}        icon="sparkles" label={ctx.lang === 'vi' ? 'Trang chủ' : 'Home'}/>
            </>
          )}
        </nav>

        <button onClick={onOpenCmd} className="ml-auto inline-flex items-center gap-2 px-2.5 h-8 rounded-lg bg-ink-800 border border-ink-700 hover:border-ink-600 text-ink-300 text-[12.5px] min-w-[200px]">
          <Icon name="search" size={13}/>
          <span className="flex-1 text-left">{t.common.search}</span>
          <Kbd>⌘K</Kbd>
        </button>

        <Tooltip text={ctx.lang === 'vi' ? 'Đổi sang English' : 'Switch to Vietnamese'}>
          <button onClick={() => ctx.setLang(ctx.lang === 'vi' ? 'en' : 'vi')}
            className="inline-flex items-center gap-1 px-2 h-8 rounded-lg border border-ink-700 hover:border-ink-600 text-ink-200 text-[12px] font-medium">
            <Icon name="languages" size={12}/><span>{ctx.lang.toUpperCase()}</span>
          </button>
        </Tooltip>

        <Tooltip text={ctx.theme === 'dark' ? 'Light' : 'Dark'}>
          <button onClick={() => ctx.setTheme(ctx.theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-ink-700 hover:border-ink-600 text-ink-200">
            <Icon name={ctx.theme === 'dark' ? 'sun' : 'moon'} size={13}/>
          </button>
        </Tooltip>

        {auth.user ? <UserMenu/> : (
          <button onClick={() => ctx.navigate('/login')}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-ink-950 text-[12.5px] font-semibold">
            <Icon name="arrow-right" size={12}/>{ctx.lang === 'vi' ? 'Đăng nhập' : 'Login'}
          </button>
        )}
      </div>
    </header>
  );
}

function UserMenu() {
  const { user, workspace, logout } = useAuth();
  const ctx = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const initial = (user.name || user.email).trim()[0]?.toUpperCase() || '?';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 h-8 px-2 rounded-lg border border-ink-700 hover:border-ink-600 text-ink-100">
        <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 inline-flex items-center justify-center text-[11px] font-semibold text-teal-300">{initial}</div>
        <span className="hidden sm:inline text-[12.5px] max-w-[120px] truncate">{user.name || user.email}</span>
        <Icon name="arrow-right" size={10} className="rotate-90 text-ink-400"/>
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-64 rounded-xl border border-ink-700 bg-ink-900 shadow-soft p-1.5 z-30">
          <div className="px-3 py-2 border-b border-ink-700 mb-1">
            <div className="text-ink-50 text-[13px] font-medium truncate">{user.name || user.email}</div>
            <div className="text-ink-300 text-[11.5px] truncate">{user.email}</div>
            <div className="mt-1.5 flex items-center gap-1">
              <Badge tone="teal">{user.plan}</Badge>
              {workspace && <span className="text-ink-400 text-[11px] truncate">{workspace.name}</span>}
            </div>
          </div>
          <MenuItem icon="sparkles"   label="Dashboard"   onClick={() => { ctx.navigate('/dashboard'); setOpen(false); }}/>
          <MenuItem icon="briefcase"  label="Library"     onClick={() => { ctx.navigate('/library'); setOpen(false); }}/>
          <MenuItem icon="settings"   label="Cài đặt"     onClick={() => { ctx.navigate('/settings/account'); setOpen(false); }}/>
          <MenuItem icon="key"        label="API keys"    onClick={() => { ctx.navigate('/settings/api-keys'); setOpen(false); }}/>
          <MenuItem icon="users"      label="Team"        onClick={() => { ctx.navigate('/settings/team'); setOpen(false); }}/>
          <MenuItem icon="arrow-up-right" label="Billing & Plan" onClick={() => { ctx.navigate('/settings/billing'); setOpen(false); }}/>
          <div className="my-1 border-t border-ink-700"/>
          <MenuItem icon="arrow-right" label="Đăng xuất" danger onClick={() => { setOpen(false); logout(); }}/>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick}
      className={cx('w-full flex items-center gap-2 px-2.5 h-8 rounded-md text-[13px]',
        danger ? 'text-red-300 hover:bg-red-500/10' : 'text-ink-100 hover:bg-ink-800')}>
      <Icon name={icon} size={12}/>{label}
    </button>
  );
}

function NavLink({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={cx(
      'inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[13px] font-medium transition-colors',
      active ? 'bg-ink-700 text-ink-50' : 'text-ink-200 hover:text-ink-50 hover:bg-ink-800')}>
      <Icon name={icon} size={13}/><span>{label}</span>
    </button>
  );
}
