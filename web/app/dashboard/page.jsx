'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/lib/api';
import Icon from '@/src/components/Icon';
import { Badge, Button, Card, Spinner } from '@/src/components/ui';
import cx from '@/src/lib/cx';

function Bar({ value, max }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const tone = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-teal-500';
  return (
    <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
      <div className={cx('h-full transition-all', tone)} style={{ width: pct + '%' }}/>
    </div>
  );
}

export default function DashboardPage() {
  const { user, workspace } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    API.dashboard().then(setData).catch(e => setErr(e.message));
  }, [user]);

  if (!user) {
    return <div className="px-6 py-16 text-center text-ink-300"><Spinner/></div>;
  }
  if (err) return <div className="p-8 text-red-300">Lỗi: {err}</div>;
  if (!data) return <div className="px-6 py-16 text-center"><Spinner/></div>;

  const { limits, usage, plans } = data;

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-ink-300 text-[13px] mb-1">Workspace</div>
          <h1 className="text-ink-50 text-2xl font-semibold tracking-tight">{workspace?.name || data.workspace.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={data.workspace.plan === 'free' ? 'slate' : 'teal'}>
            <Icon name="sparkles" size={11}/>Plan: {plans[data.workspace.plan]?.label}
          </Badge>
          <Link href="/settings/billing">
            <Button variant="outline" size="sm"><Icon name="arrow-up-right" size={12}/>Đổi plan</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Scan tháng này" value={usage.scansThisMonth} max={limits.scansPerMonth} icon="github"/>
        <StatCard label="Chat tháng này" value={usage.chatThisMonth}  max={limits.chatPerMonth}  icon="message-square"/>
        <StatCard label="Thành viên"      value={usage.members}        max={limits.members}        icon="users"/>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-ink-50 font-semibold">Hành động nhanh</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ActionLink href="/" icon="github" title="Quét repo mới" desc="Phân tích GitHub repo bằng AI"/>
          <ActionLink href="/library" icon="briefcase" title="Thư viện" desc={(usage.totalScans || 0) + ' scan đã lưu'}/>
          <ActionLink href="/settings/api-keys" icon="key" title="API keys" desc={(usage.apiKeys || 0) + '/' + limits.apiKeys + ' key đang dùng'}/>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-ink-50 font-semibold mb-3">So sánh các plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['free','pro','team'].map(k => (
            <div key={k} className={cx('rounded-xl border p-4',
              data.workspace.plan === k ? 'border-teal-500/50 bg-teal-500/5' : 'border-ink-700 bg-ink-900/40')}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-ink-50 font-semibold">{plans[k].label}</div>
                <div className="text-ink-300 text-[12px]">${plans[k].price}/mo</div>
              </div>
              <ul className="text-[12.5px] text-ink-200 space-y-1">
                <li>{plans[k].scansPerMonth.toLocaleString()} scan/tháng</li>
                <li>{plans[k].chatPerMonth.toLocaleString()} chat/tháng</li>
                <li>{plans[k].members} thành viên</li>
                <li>{plans[k].apiKeys} API keys</li>
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, max, icon }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-ink-300 text-[12px]">{label}</div>
        <Icon name={icon} size={14} className="text-ink-400"/>
      </div>
      <div className="text-ink-50 text-2xl font-semibold mb-2">{value.toLocaleString()} <span className="text-ink-400 text-base font-normal">/ {max.toLocaleString()}</span></div>
      <Bar value={value} max={max}/>
    </Card>
  );
}

function ActionLink({ href, icon, title, desc }) {
  return (
    <Link href={href} className="block rounded-lg border border-ink-700 hover:border-teal-500/40 p-3 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Icon name={icon} size={14} className="text-teal-400"/>
        <span className="text-ink-50 font-medium text-[14px]">{title}</span>
      </div>
      <div className="text-ink-300 text-[12.5px]">{desc}</div>
    </Link>
  );
}
