'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cx from '@/src/lib/cx';

const TABS = [
  { href: '/settings/account',  label: 'Tài khoản' },
  { href: '/settings/api-keys', label: 'API keys' },
  { href: '/settings/team',     label: 'Team' },
  { href: '/settings/billing',  label: 'Billing & Plan' },
  { href: '/settings',          label: 'LLM Provider' },
];

export default function SettingsNav() {
  const pathname = usePathname() || '/';
  return (
    <div className="flex items-center gap-1 mb-6 border-b border-ink-700 overflow-x-auto">
      {TABS.map(t => {
        const active = pathname === t.href || (t.href !== '/settings' && pathname.startsWith(t.href));
        return (
          <Link key={t.href} href={t.href}
            className={cx(
              'px-3 h-9 inline-flex items-center text-[13px] border-b-2 transition-colors -mb-px',
              active ? 'border-teal-500 text-ink-50' : 'border-transparent text-ink-300 hover:text-ink-100'
            )}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
