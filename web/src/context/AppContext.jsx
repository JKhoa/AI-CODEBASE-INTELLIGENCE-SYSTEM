'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import I18N from '@/src/lib/i18n';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const [lang, setLang]   = useState('vi');
  const [theme, setTheme] = useState('dark');
  const [mode, setMode]   = useState('cloud');

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    setLang(localStorage.getItem('lang')   || 'vi');
    setTheme(localStorage.getItem('theme') || 'dark');
    setMode(localStorage.getItem('mode')   || 'cloud');
  }, []);

  useEffect(() => { localStorage.setItem('lang', lang); document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.style.background = theme === 'light' ? '#F6F7F9' : '#0B0D10';
    document.body.style.color      = theme === 'light' ? '#0E1116' : '#C9CFDB';
  }, [theme]);
  useEffect(() => { localStorage.setItem('mode', mode); }, [mode]);

  const t = I18N[lang];
  const navigate = (to) => router.push(to);

  const value = useMemo(() => ({
    t, lang, setLang, theme, setTheme, mode, setMode,
    navigate, path: pathname,
  }), [t, lang, theme, mode, pathname]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be inside <AppProvider>');
  return v;
}
