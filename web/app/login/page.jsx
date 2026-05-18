'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import Icon from '@/src/components/Icon';
import { Button, Card, Spinner } from '@/src/components/ui';

export default function LoginPage() {
  return <Suspense fallback={null}><LoginInner/></Suspense>;
}

function LoginInner() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await login({ email, password });
      router.replace(next);
    } catch (e) {
      setErr(e?.payload?.detail || e.message || 'Đăng nhập thất bại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-grid bg-radial-spot">
      <Card className="w-full max-w-sm p-7">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/40 inline-flex items-center justify-center">
            <Icon name="sparkles" size={15} className="text-teal-400"/>
          </div>
          <div className="font-semibold text-ink-50">AI Codebase Intelligence</div>
        </div>
        <h1 className="text-ink-50 text-xl font-semibold mb-1">Đăng nhập</h1>
        <p className="text-ink-300 text-[13px] mb-5">Truy cập workspace để tiếp tục phân tích.</p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[12px] text-ink-300 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-ink-900 border border-ink-700 focus:border-teal-500/60 outline-none rounded-lg px-3 h-10 text-ink-50 text-[14px]"
              placeholder="you@company.com" autoFocus/>
          </div>
          <div>
            <label className="block text-[12px] text-ink-300 mb-1">Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-ink-900 border border-ink-700 focus:border-teal-500/60 outline-none rounded-lg px-3 h-10 text-ink-50 text-[14px]"
              placeholder="••••••••"/>
          </div>
          {err && <div className="text-[12px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-2.5 py-1.5">{err}</div>}
          <Button variant="primary" size="lg" type="submit" disabled={busy} className="w-full">
            {busy ? <Spinner size={14}/> : <Icon name="arrow-right" size={14}/>}
            <span>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</span>
          </Button>
        </form>

        <div className="mt-5 text-center text-[12.5px] text-ink-300">
          Chưa có tài khoản?{' '}
          <Link href={'/signup?next=' + encodeURIComponent(next)} className="text-teal-400 hover:text-teal-300">Đăng ký</Link>
        </div>
      </Card>
    </div>
  );
}
