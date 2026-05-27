// Browser API client. Same-origin /api/* is rewritten by Next.js to the backend.
'use client';

const API_BASE = '';   // requests go through the Next.js rewrite → :8000.

import { supabase } from './supabase';

const TOKEN_KEY = 'auth.token.v1';
let _authToken = null;
if (typeof window !== 'undefined') {
  try { _authToken = localStorage.getItem(TOKEN_KEY) || null; } catch {}
}

export function setAuthToken(t) {
  _authToken = t || null;
  if (typeof window !== 'undefined') {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else   localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
}
export function getAuthToken()   { return _authToken; }

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  
  // Get token from Supabase Auth
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers['Authorization'] = 'Bearer ' + session.access_token;
  } else if (_authToken) {
    headers['Authorization'] = 'Bearer ' + _authToken; // fallback
  }

  const res = await fetch(API_BASE + path, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`API ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    try { err.payload = JSON.parse(text); } catch {}
    throw err;
  }
  return res.json();
}

export const API = {
  available: false, _probed: false,
  async probe() {
    if (this._probed) return this.available;
    this._probed = true;
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 1500);
      const r = await fetch(API_BASE + '/api/health', { signal: ctrl.signal });
      clearTimeout(tm);
      this.available = r.ok;
    } catch { this.available = false; }
    return this.available;
  },

  // ---- Auth ----
  signup:  (body)              => apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login:   (body)              => apiFetch('/api/auth/login',  { method: 'POST', body: JSON.stringify(body) }),
  me:      ()                  => apiFetch('/api/auth/me'),
  updatePlan: (plan)           => apiFetch('/api/auth/plan',   { method: 'POST', body: JSON.stringify({ plan }) }),
  dashboard: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: scans } = await supabase.from('scans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
    const { data: workspaces } = await supabase.from('workspaces').select('*').eq('owner_id', user.id).limit(1);
    
    return {
      recent_scans: scans || [],
      stats: { total_scans: scans?.length || 0, this_month: scans?.length || 0 },
      active_plan: workspaces?.[0]?.plan || 'free'
    };
  },
  plans:   ()                  => apiFetch('/api/plans'),

  // ---- Workspaces ----
  workspaces: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('workspaces').select('*').eq('owner_id', user?.id || '');
    return data || [];
  },
  workspaceMembers:(wid)        => apiFetch('/api/workspaces/' + encodeURIComponent(wid) + '/members'),
  invite:        (wid, body)    => apiFetch('/api/workspaces/' + encodeURIComponent(wid) + '/invite', { method: 'POST', body: JSON.stringify(body) }),
  acceptInvite:  (token)        => apiFetch('/api/invites/accept', { method: 'POST', body: JSON.stringify({ token }) }),
  removeMember:  (wid, mid)     => apiFetch('/api/workspaces/' + encodeURIComponent(wid) + '/members/' + encodeURIComponent(mid), { method: 'DELETE' }),

  // ---- API keys ----
  listApiKeys:   ()             => apiFetch('/api/api-keys'),
  createApiKey:  (name)         => apiFetch('/api/api-keys', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteApiKey:  (id)           => apiFetch('/api/api-keys/' + encodeURIComponent(id), { method: 'DELETE' }),

  // ---- Scans ----
  async startScan(url, token, workspaceId) {
    return apiFetch('/api/scan', { method: 'POST', body: JSON.stringify({ url, token: token || null, workspaceId: workspaceId || null }) });
  },
  scanStream: async (body, onChunk) => {
    const headers = { 'Content-Type': 'application/json' };
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers['Authorization'] = 'Bearer ' + session.access_token;
    else if (_authToken) headers['Authorization'] = 'Bearer ' + _authToken;

    const res = await fetch(API_BASE + '/api/scan-stream', { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Stream Error: ${res.status}`);
    
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const str = line.slice(6).trim();
          if (str === '[DONE]') continue;
          try {
            const data = JSON.parse(str);
            onChunk(data);
          } catch (e) {}
        }
      }
    }
  },
  getScan: async (sid, share) => {
    let query = supabase.from('scans').select('*');
    if (share) query = query.eq('share_token', share);
    else query = query.eq('id', sid);
    const { data } = await query.single();
    if (!data) throw new Error("Scan not found");
    return data.data; // Since 'data' column holds the JSON output
  },
  getTree:    (sid)             => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/tree'),
  getFile:    (sid, p)          => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/file?path=' + encodeURIComponent(p)),
  getReadme:  (sid)             => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/readme'),
  shareScan:  (sid, visibility) => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/share', { method: 'POST', body: JSON.stringify({ visibility }) }),
  
  listLibrary: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('scans').select('id, repo_owner, repo_name, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    // Map to old schema expected by UI
    return data.map(d => ({
      id: d.id,
      repo: { owner: d.repo_owner, name: d.repo_name },
      status: d.status,
      timestamp: new Date(d.created_at).getTime() / 1000
    }));
  },

  deleteScan: async (sid) => {
    return await supabase.from('scans').delete().eq('id', sid);
  },
  chat:       (payload)         => apiFetch('/api/chat',    { method: 'POST', body: JSON.stringify(payload) }),
  chatStream: async (body, onChunk) => {
    const headers = { 'Content-Type': 'application/json' };
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers['Authorization'] = 'Bearer ' + session.access_token;
    else if (_authToken) headers['Authorization'] = 'Bearer ' + _authToken;

    const res = await fetch(API_BASE + '/api/chat-stream', { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Stream Error: ${res.status}`);
    
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const str = line.slice(6).trim();
          if (str === '[DONE]') return;
          try {
            const data = JSON.parse(str);
            if (data.text) onChunk(data.text);
          } catch (e) {}
        }
      }
    }
  },
  compare:    (a, b)            => apiFetch('/api/compare?a=' + encodeURIComponent(a) + '&b=' + encodeURIComponent(b)),
  docMd:      (sid, lang)       => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/doc.md?lang=' + (lang || 'vi')),
  deps:       (sid)             => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/dependencies'),

  // ---- LLM config ----
  getLlmCfg:  ()                => apiFetch('/api/llm/config'),
  setLlmCfg:  (cfg)             => apiFetch('/api/llm/config', { method: 'POST', body: JSON.stringify(cfg) }),
  testLlm:    (cfg)             => apiFetch('/api/llm/test',   { method: 'POST', body: JSON.stringify(cfg || {}) }),
};

const LLM_STORE_KEY = 'llm.cfg.v1';
export function loadLlmCfg() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LLM_STORE_KEY)) || {}; } catch { return {}; }
}
export function saveLlmCfg(cfg) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LLM_STORE_KEY, JSON.stringify(cfg || {})); } catch {}
}

// Adapter: server session → UI shape.
// Handles partial data gracefully during progressive loading.
export function adaptSessionForUI(s) {
  if (!s) return null;
  const repo = s.repo || {};
  return {
    id: s.id, status: s.status, stage: s.stage, error: s.error,
    repo: {
      url: repo.url || '', owner: repo.owner || '', name: repo.name || '',
      branch: repo.branch || 'main', commit: (repo.commit || '').slice(0, 7),
      stars: repo.stars || 0, forks: repo.forks || 0,
      license: repo.license || '—', desc: repo.desc || { vi: '', en: '' },
    },
    stats: s.stats || { loc: 0, files: 0, modules: 0, contributors: 0, lastCommit: '' },
    langs: (s.langs || []).map(l => ({ name: l.name || '', pct: Math.round(l.pct || 0), color: l.color || '#ccc' })),
    frameworks: s.frameworks || [],
    tree:       s.tree       || [],
    arch:       s.arch       || { nodes: [], edges: [] },
    modules: (s.modules || []).map(m => ({ ...m, purpose: m.purpose || { vi: m.name, en: m.name } })),
    security:(s.security || []).map(f => ({
      ...f, title: f.title || { vi: f.rule, en: f.rule }, why: f.why || { vi: '', en: '' }, refs: f.refs || [],
    })),
    tours: s.tours || [],
    domains: s.domains || [],
    readme: s.readme || '',
    visibility: s.visibility, shareToken: s.shareToken,
  };
}

export default API;
