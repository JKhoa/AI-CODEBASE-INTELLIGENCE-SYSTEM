'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import Icon from '@/src/components/Icon';
import { Button, Card, Spinner } from '@/src/components/ui';

export default function SignupPage() {
  return <Suspense fallback={null}><SignupInner/></Suspense>;
}

function SignupInner() {
  const { signup } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await signup({ email, password, name });
      router.replace(next);
    } catch (e) {
      setErr(e?.payload?.detail || e.message || 'Đăng ký thất bại');
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
        <h1 className="text-ink-50 text-xl font-semibold mb-1">Tạo tài khoản</h1>
        <p className="text-ink-300 text-[13px] mb-5">Miễn phí — 10 scan/tháng. Không cần thẻ tín dụng.</p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[12px] text-ink-300 mb-1">Tên hiển thị</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-ink-900 border border-ink-700 focus:border-teal-500/60 outline-none rounded-lg px-3 h-10 text-ink-50 text-[14px]"
              placeholder="Khoa N."/>
          </div>
          <div>
            <label className="block text-[12px] text-ink-300 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-ink-900 border border-ink-700 focus:border-teal-500/60 outline-none rounded-lg px-3 h-10 text-ink-50 text-[14px]"
              placeholder="you@company.com"/>
          </div>
          <div>
            <label className="block text-[12px] text-ink-300 mb-1">Mật khẩu (≥ 6 ký tự)</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-ink-900 border border-ink-700 focus:border-teal-500/60 outline-none rounded-lg px-3 h-10 text-ink-50 text-[14px]"
              placeholder="••••••••"/>
          </div>
          {err && <div className="text-[12px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-2.5 py-1.5">{err}</div>}
          <Button variant="primary" size="lg" type="submit" disabled={busy} className="w-full">
            {busy ? <Spinner size={14}/> : <Icon name="sparkles" size={14}/>}
            <span>{busy ? 'Đang tạo…' : 'Tạo tài khoản'}</span>
          </Button>
        </form>

        <div className="mt-5 text-center text-[12.5px] text-ink-300">
          Đã có tài khoản?{' '}
          <Link href={'/login?next=' + encodeURIComponent(next)} className="text-teal-400 hover:text-teal-300">Đăng nhập</Link>
        </div>
      </Card>
    </div>
  );
}
