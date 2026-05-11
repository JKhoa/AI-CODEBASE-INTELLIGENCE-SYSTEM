'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '@/src/context/AppContext';
import TopBar from '@/src/components/TopBar';
import CommandPalette from '@/src/components/CommandPalette';

function Inner({ children }) {
  const pathname = usePathname() || '/';
  const isFullBleed = pathname.startsWith('/scan/');
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <TopBar onOpenCmd={() => setCmdOpen(true)}/>
      <main className={'flex-1 min-h-0 ' + (isFullBleed ? 'overflow-hidden' : 'overflow-y-auto')}>
        {children}
      </main>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)}/>
    </div>
  );
}

export default function Shell({ children }) {
  return <AppProvider><Inner>{children}</Inner></AppProvider>;
}
