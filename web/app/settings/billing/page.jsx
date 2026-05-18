'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/lib/api';
import Icon from '@/src/components/Icon';
import { Badge, Button, Card, Spinner } from '@/src/components/ui';
import SettingsNav from '@/src/components/SettingsNav';
import cx from '@/src/lib/cx';

export default function BillingPage() {
  const { user, refresh } = useAuth();
  const [plans, setPlans] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => { API.plans().then(d => setPlans(d.plans)); }, []);

  const switchPlan = async (key) => {
    setBusy(key);
    try {
      await API.updatePlan(key);
      await refresh();
    } finally { setBusy(null); }
  };

  if (!plans || !user) return <div className="p-10 text-center"><Spinner/></div>;

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-ink-50 text-2xl font-semibold mb-6">Settings</h1>
      <SettingsNav/>

      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-ink-300 text-[12.5px]">Plan hiện tại</div>
            <div className="text-ink-50 text-xl font-semibold mt-1">{plans[user.plan].label}</div>
          </div>
          <Badge tone="teal">Active</Badge>
        </div>
        <p className="text-ink-300 text-[12.5px] mt-3">
          Bản SaaS này không tích hợp Stripe — bạn có thể đổi plan tức thì để mở khoá quota cao hơn (cho mục đích demo).
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['free','pro','team'].map(k => {
          const p = plans[k];
          const current = user.plan === k;
          return (
            <Card key={k} className={cx('p-5', current && 'border-teal-500/60')}>
              <div className="flex items-center justify-between">
                <div className="text-ink-50 font-semibold">{p.label}</div>
                {current && <Badge tone="teal">Hiện tại</Badge>}
              </div>
              <div className="mt-2 text-ink-50 text-2xl font-semibold">${p.price}<span className="text-ink-400 text-sm font-normal">/mo</span></div>
              <ul className="mt-4 text-[13px] text-ink-200 space-y-1.5">
                <li className="flex items-center gap-2"><Icon name="check-circle" size={11} className="text-teal-400"/>{p.scansPerMonth.toLocaleString()} scan/tháng</li>
                <li className="flex items-center gap-2"><Icon name="check-circle" size={11} className="text-teal-400"/>{p.chatPerMonth.toLocaleString()} chat/tháng</li>
                <li className="flex items-center gap-2"><Icon name="check-circle" size={11} className="text-teal-400"/>{p.members} thành viên</li>
                <li className="flex items-center gap-2"><Icon name="check-circle" size={11} className="text-teal-400"/>{p.apiKeys} API keys</li>
                <li className="flex items-center gap-2"><Icon name="check-circle" size={11} className="text-teal-400"/>Repo &lt; {Math.round(p.maxRepoKB/1000)} MB</li>
              </ul>
              <div className="mt-5">
                <Button variant={current ? 'outline' : 'primary'} className="w-full"
                  disabled={current || busy === k}
                  onClick={() => switchPlan(k)}>
                  {busy === k ? <Spinner size={12}/> : current ? 'Đang dùng' : 'Chuyển sang ' + p.label}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
