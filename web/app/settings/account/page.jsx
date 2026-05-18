'use client';

import { useAuth } from '@/src/context/AuthContext';
import Icon from '@/src/components/Icon';
import { Badge, Card } from '@/src/components/ui';
import SettingsNav from '@/src/components/SettingsNav';

export default function AccountPage() {
  const { user, workspace, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-ink-50 text-2xl font-semibold mb-6">Settings</h1>
      <SettingsNav/>
      <Card className="p-6">
        <h2 className="text-ink-50 font-semibold mb-4">Tài khoản</h2>
        <Row label="Email" value={user.email}/>
        <Row label="Tên" value={user.name || '—'}/>
        <Row label="Plan hiện tại" value={<Badge tone="teal">{user.plan}</Badge>}/>
        <Row label="Workspace mặc định" value={workspace?.name || '—'}/>
        <div className="mt-6 pt-4 border-t border-ink-700">
          <button onClick={logout} className="inline-flex items-center gap-2 text-red-300 hover:text-red-200 text-[13px]">
            <Icon name="arrow-right" size={12}/>Đăng xuất
          </button>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-ink-700 last:border-0">
      <div className="text-ink-300 text-[13px]">{label}</div>
      <div className="col-span-2 text-ink-50 text-[14px]">{value}</div>
    </div>
  );
}
