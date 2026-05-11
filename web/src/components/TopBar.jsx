'use client';

import { useApp } from '@/src/context/AppContext';
import Icon from '@/src/components/Icon';
import { Tooltip, Kbd } from '@/src/components/ui';
import cx from '@/src/lib/cx';

export default function TopBar({ onOpenCmd }) {
  const ctx = useApp();
  const t = ctx.t;
  const at = (p) => ctx.path === p || (p !== '/' && ctx.path.startsWith(p));

  return (
    <header className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center h-12 px-4 gap-3">
        <button onClick={() => ctx.navigate('/')} className="flex items-center gap-2">
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
          <NavLink active={at('/')} onClick={() => ctx.navigate('/')} icon="sparkles"
            label={ctx.lang === 'vi' ? 'Trang chủ' : 'Home'}/>
          <NavLink active={at('/library')} onClick={() => ctx.navigate('/library')} icon="briefcase"
            label={t.nav.library}/>
        </nav>

        <button onClick={onOpenCmd} className="ml-auto inline-flex items-center gap-2 px-2.5 h-8 rounded-lg bg-ink-800 border border-ink-700 hover:border-ink-600 text-ink-300 text-[12.5px] min-w-[200px]">
          <Icon name="search" size={13}/>
          <span className="flex-1 text-left">{t.common.search}</span>
          <Kbd>⌘K</Kbd>
        </button>

        <Tooltip text={ctx.mode === 'cloud' ? t.cloud : t.local}>
          <button onClick={() => ctx.setMode(ctx.mode === 'cloud' ? 'local' : 'cloud')}
            className={cx('inline-flex items-center gap-1.5 px-2 h-8 rounded-lg border text-[12px] font-medium',
              ctx.mode === 'cloud'
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                : 'bg-violet-500/10 border-violet-500/30 text-violet-300')}>
            <Icon name={ctx.mode === 'cloud' ? 'cloud' : 'server'} size={12}/>
            <span className="hidden md:inline">{ctx.mode === 'cloud' ? 'Cloud' : 'Local'}</span>
          </button>
        </Tooltip>

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

        <Tooltip text={t.nav.settings}>
          <button onClick={() => ctx.navigate('/settings')}
            className={cx('inline-flex items-center justify-center w-8 h-8 rounded-lg border hover:border-ink-600 text-ink-200',
              at('/settings') ? 'bg-ink-700 border-ink-500 text-ink-50' : 'border-ink-700')}>
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
      active ? 'bg-ink-700 text-ink-50' : 'text-ink-200 hover:text-ink-50 hover:bg-ink-800')}>
      <Icon name={icon} size={13}/><span>{label}</span>
    </button>
  );
}
