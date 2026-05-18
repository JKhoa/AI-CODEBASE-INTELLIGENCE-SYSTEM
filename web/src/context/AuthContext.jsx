'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import API, { setAuthToken } from '@/src/lib/api';
import { supabase } from '@/src/lib/supabase';

const Ctx = createContext(null);

const TOKEN_KEY = 'auth.token.v1';
const PUBLIC_PREFIXES = ['/login', '/signup', '/share/', '/forgot'];

export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Setup Supabase Auth listener
  useEffect(() => {
    // Check active session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionUpdate(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSessionUpdate(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSessionUpdate = async (session) => {
    if (session) {
      const accessToken = session.access_token;
      setAuthToken(accessToken);
      localStorage.setItem(TOKEN_KEY, accessToken);
      setTokenState(accessToken);
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email,
      });

      try {
        // Fetch actual workspace data from Supabase Database
        const { data: wsData, error: wsError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', session.user.id);
        
        if (!wsError && wsData && wsData.length > 0) {
          setWorkspace(wsData[0]);
          setWorkspaces(wsData);
        } else {
          // Fallback if not created yet by trigger
          const defaultWk = { id: session.user.id, name: 'Personal Workspace', plan: 'free' };
          setWorkspace(defaultWk);
          setWorkspaces([defaultWk]);
        }
      } catch (err) {
        console.error("Failed to load workspace data from Supabase", err);
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      setWorkspace(null);
      setWorkspaces([]);
      setLoading(false);
    }
  };

  const signup = useCallback(async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    if (data.session) {
      await handleSessionUpdate(data.session);
    }
    return data;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.session) {
      await handleSessionUpdate(data.session);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    setWorkspace(null);
    setWorkspaces([]);
    router.push('/login');
  }, [router]);

  const refresh = useCallback(async () => {
    const d = await API.me();
    setUser(d.user);
    setWorkspaces(d.workspaces || []);
    const def = (d.workspaces || []).find(w => w.id === d.defaultWorkspaceId) || (d.workspaces || [])[0];
    setWorkspace(def || null);
    return d;
  }, []);

  // Route guard: redirect to /login if no token, except on public pages and `/`.
  useEffect(() => {
    if (loading) return;
    const isPublic = pathname === '/' || PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
    if (!token && !isPublic) {
      router.replace('/login?next=' + encodeURIComponent(pathname));
    }
  }, [loading, token, pathname, router]);

  return (
    <Ctx.Provider value={{ token, user, workspace, workspaces, loading, signup, login, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside <AuthProvider>');
  return v;
}
