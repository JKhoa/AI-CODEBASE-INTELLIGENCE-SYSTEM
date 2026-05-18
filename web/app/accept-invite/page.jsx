'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import API from '@/src/lib/api';
import { Button, Card, Spinner } from '@/src/components/ui';
import Icon from '@/src/components/Icon';

export default function AcceptInvitePage() {
  return <Suspense fallback={null}><AcceptInner/></Suspense>;
}

function AcceptInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const inviteToken = params.get('token') || '';
  const [status, setStatus] = useState('idle');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user && !token) {
      router.replace('/login?next=' + encodeURIComponent('/accept-invite?token=' + inviteToken));
    }
  }, [user, token, inviteToken, router]);

  const accept = async () => {
    setStatus('busy'); setErr('');
    try { await API.acceptInvite(inviteToken); setStatus('done'); }
    catch (e) { setErr(e?.payload?.detail || e.message); setStatus('idle'); }
  };

  return (
    <div className="px-6 py-20 max-w-md mx-auto">
      <Card className="p-7 text-center">
        <Icon name="users" size={32} className="mx-auto text-teal-400 mb-3"/>
        <h1 className="text-ink-50 text-xl font-semibold mb-1">Tham gia workspace</h1>
        <p className="text-ink-300 text-[13px] mb-5">Token: <code className="font-mono">{inviteToken.slice(0, 12)}…</code></p>
        {status === 'done' ? (
          <div>
            <div className="text-teal-300 mb-3">Đã tham gia thành công.</div>
            <Button variant="primary" onClick={() => router.push('/dashboard')}>Đến Dashboard</Button>
          </div>
        ) : (
          <>
            <Button variant="primary" disabled={status === 'busy' || !user} onClick={accept}>
              {status === 'busy' ? <Spinner size={12}/> : <Icon name="check-circle" size={12}/>}Chấp nhận
            </Button>
            {err && <div className="mt-3 text-[12.5px] text-red-300">{err}</div>}
          </>
        )}
      </Card>
    </div>
  );
}
