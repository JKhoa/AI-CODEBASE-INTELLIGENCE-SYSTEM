'use client';

import { useEffect, useState } from 'react';
import API from '@/src/lib/api';
import Icon from '@/src/components/Icon';
import { Button, Card, Spinner } from '@/src/components/ui';
import SettingsNav from '@/src/components/SettingsNav';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('');
  const [revealed, setRevealed] = useState(null);   // newly created key (shown once)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const reload = () => API.listApiKeys().then(d => setKeys(d.items)).catch(e => setErr(e.message));
  useEffect(() => { reload(); }, []);

  const create = async (e) => {
    e?.preventDefault?.();
    setBusy(true); setErr('');
    try {
      const r = await API.createApiKey(name || 'default');
      setRevealed(r.key);
      setName('');
      reload();
    } catch (e) {
      setErr(e?.payload?.detail || e.message);
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm('Xoá API key này? Các client đang dùng sẽ ngừng hoạt động.')) return;
    await API.deleteApiKey(id); reload();
  };

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-ink-50 text-2xl font-semibold mb-6">Settings</h1>
      <SettingsNav/>

      <Card className="p-6 mb-4">
        <h2 className="text-ink-50 font-semibold mb-1">Tạo API key</h2>
        <p className="text-ink-300 text-[12.5px] mb-4">
          Dùng cho gọi REST programmatic: <code className="bg-ink-900 px-1 py-0.5 rounded text-[11.5px]">Authorization: Bearer &lt;key&gt;</code>
        </p>
        <form onSubmit={create} className="flex items-center gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên key (vd: ci-deploy)"
            className="flex-1 bg-ink-900 border border-ink-700 focus:border-teal-500/60 outline-none rounded-lg px-3 h-10 text-ink-50 text-[14px]"/>
          <Button variant="primary" disabled={busy} type="submit">
            {busy ? <Spinner size={12}/> : <Icon name="key" size={12}/>}Tạo key
          </Button>
        </form>
        {err && <div className="mt-3 text-[12.5px] text-red-300">{err}</div>}
        {revealed && (
          <div className="mt-4 p-3 rounded-lg border border-teal-500/40 bg-teal-500/5">
            <div className="text-[12px] text-teal-300 mb-1.5 flex items-center gap-1.5">
              <Icon name="alert-triangle" size={11}/>Lưu key này — sẽ không hiển thị lại
            </div>
            <div className="font-mono text-[12.5px] text-ink-50 bg-ink-900 rounded px-2.5 py-2 break-all">{revealed}</div>
            <button onClick={() => { navigator.clipboard?.writeText(revealed); }}
              className="mt-2 text-[12px] text-teal-400 hover:text-teal-300">Sao chép vào clipboard</button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-ink-50 font-semibold mb-3">API keys hiện có</h2>
        {keys.length === 0 ? (
          <p className="text-ink-300 text-[13px]">Chưa có key nào.</p>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border border-ink-700 bg-ink-900/40">
                <div>
                  <div className="text-ink-50 text-[14px] font-medium">{k.name}</div>
                  <div className="font-mono text-[11.5px] text-ink-300 mt-0.5">{k.prefix}</div>
                  <div className="text-[11px] text-ink-400 mt-1">
                    Tạo: {new Date(k.createdAt * 1000).toLocaleString()}{' • '}
                    Last used: {k.lastUsedAt ? new Date(k.lastUsedAt * 1000).toLocaleString() : 'chưa'}
                  </div>
                </div>
                <button onClick={() => remove(k.id)} className="text-red-300 hover:text-red-200 text-[12.5px]">Xoá</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
