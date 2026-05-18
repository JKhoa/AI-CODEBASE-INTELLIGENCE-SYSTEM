'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/lib/api';
import Icon from '@/src/components/Icon';
import { Badge, Button, Card, Spinner } from '@/src/components/ui';
import SettingsNav from '@/src/components/SettingsNav';

export default function TeamPage() {
  const { workspace } = useAuth();
  const [data, setData] = useState({ members: [], invites: [] });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [acceptToken, setAcceptToken] = useState('');
  const [info, setInfo] = useState('');

  const reload = () => {
    if (!workspace?.id) return;
    API.workspaceMembers(workspace.id).then(setData).catch(e => setErr(e.message));
  };
  useEffect(reload, [workspace?.id]);

  const invite = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(''); setInfo('');
    try {
      const r = await API.invite(workspace.id, { email, role });
      const url = window.location.origin + '/accept-invite?token=' + r.token;
      setInfo('Đã tạo lời mời. Gửi link này cho ' + r.email + ':\n' + url);
      setEmail('');
      reload();
    } catch (e) {
      setErr(e?.payload?.detail || e.message);
    } finally { setBusy(false); }
  };

  const removeMember = async (id) => {
    if (!confirm('Xoá thành viên này?')) return;
    await API.removeMember(workspace.id, id); reload();
  };

  const accept = async (e) => {
    e.preventDefault();
    try {
      await API.acceptInvite(acceptToken);
      setInfo('Đã tham gia workspace.');
      setAcceptToken('');
    } catch (e) { setErr(e?.payload?.detail || e.message); }
  };

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-ink-50 text-2xl font-semibold mb-6">Settings</h1>
      <SettingsNav/>

      <Card className="p-6 mb-4">
        <h2 className="text-ink-50 font-semibold mb-1">Mời thành viên vào workspace</h2>
        <p className="text-ink-300 text-[12.5px] mb-4">Người được mời cần đăng ký bằng email tương ứng, sau đó dán token để tham gia.</p>
        <form onSubmit={invite} className="flex items-center gap-2 flex-wrap">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com"
            className="flex-1 min-w-[220px] bg-ink-900 border border-ink-700 focus:border-teal-500/60 outline-none rounded-lg px-3 h-10 text-ink-50 text-[14px]"/>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="bg-ink-900 border border-ink-700 rounded-lg px-2 h-10 text-ink-100 text-[13px]">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <Button variant="primary" disabled={busy} type="submit">
            {busy ? <Spinner size={12}/> : <Icon name="users" size={12}/>}Mời
          </Button>
        </form>
        {err && <div className="mt-3 text-[12.5px] text-red-300">{err}</div>}
        {info && <div className="mt-3 text-[12px] text-teal-300 whitespace-pre-wrap bg-teal-500/5 border border-teal-500/30 rounded-md p-2.5 font-mono break-all">{info}</div>}
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-ink-50 font-semibold mb-3">Thành viên ({data.members.length})</h2>
        <div className="space-y-2">
          {data.members.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-ink-700 bg-ink-900/40">
              <div>
                <div className="text-ink-50 text-[14px]">{m.email}</div>
                <div className="text-ink-300 text-[11.5px]">{m.name || '—'} · joined {new Date(m.joinedAt*1000).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={m.role==='owner'?'teal':m.role==='admin'?'blue':'slate'}>{m.role}</Badge>
                {m.role !== 'owner' && (
                  <button onClick={() => removeMember(m.id)} className="text-red-300 hover:text-red-200 text-[12.5px]">Xoá</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {data.invites?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-ink-200 text-[13px] font-medium mb-2">Lời mời chưa chấp nhận</h3>
            <div className="space-y-2">
              {data.invites.map(inv => (
                <div key={inv.id} className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <div className="text-ink-100 text-[13.5px]">{inv.email} <span className="text-amber-300">({inv.role})</span></div>
                  <div className="font-mono text-[11.5px] text-ink-300 mt-1 break-all">token: {inv.token}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-ink-50 font-semibold mb-2">Chấp nhận lời mời</h2>
        <p className="text-ink-300 text-[12.5px] mb-3">Nếu được mời vào workspace khác, dán token tại đây.</p>
        <form onSubmit={accept} className="flex items-center gap-2">
          <input value={acceptToken} onChange={e => setAcceptToken(e.target.value)} placeholder="Invite token"
            className="flex-1 bg-ink-900 border border-ink-700 focus:border-teal-500/60 outline-none rounded-lg px-3 h-10 text-ink-50 text-[14px] font-mono"/>
          <Button variant="primary" type="submit"><Icon name="check-circle" size={12}/>Chấp nhận</Button>
        </form>
      </Card>
    </div>
  );
}
