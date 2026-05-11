// Browser API client. Same-origin /api/* is rewritten by Next.js to the backend.
'use client';

const API_BASE = '';   // requests go through the Next.js rewrite → :8000.

async function apiFetch(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`API ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
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
      const r = await fetch(API_BASE + '/api/library', { signal: ctrl.signal });
      clearTimeout(tm);
      this.available = r.ok;
    } catch { this.available = false; }
    return this.available;
  },

  async startScan(url, token) {
    return apiFetch('/api/scan', { method: 'POST', body: JSON.stringify({ url, token: token || null }) });
  },
  getScan:    (sid)         => apiFetch('/api/scan/' + encodeURIComponent(sid)),
  getTree:    (sid)         => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/tree'),
  getFile:    (sid, p)      => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/file?path=' + encodeURIComponent(p)),
  getReadme:  (sid)         => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/readme'),
  listLibrary:()            => apiFetch('/api/library'),
  deleteScan: (sid)         => apiFetch('/api/scan/' + encodeURIComponent(sid), { method: 'DELETE' }),
  chat:       (payload)     => apiFetch('/api/chat',    { method: 'POST', body: JSON.stringify(payload) }),
  compare:    (a, b)        => apiFetch('/api/compare?a=' + encodeURIComponent(a) + '&b=' + encodeURIComponent(b)),
  docMd:      (sid, lang)   => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/doc.md?lang=' + (lang || 'vi')),
  deps:       (sid)         => apiFetch('/api/scan/' + encodeURIComponent(sid) + '/dependencies'),
  getLlmCfg:  ()            => apiFetch('/api/llm/config'),
  setLlmCfg:  (cfg)         => apiFetch('/api/llm/config', { method: 'POST', body: JSON.stringify(cfg) }),
  testLlm:    (cfg)         => apiFetch('/api/llm/test',   { method: 'POST', body: JSON.stringify(cfg || {}) }),
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
export function adaptSessionForUI(s) {
  if (!s) return null;
  return {
    id: s.id, status: s.status, stage: s.stage, error: s.error,
    repo: {
      url: s.repo.url, owner: s.repo.owner, name: s.repo.name,
      branch: s.repo.branch || 'main', commit: (s.repo.commit || '').slice(0, 7),
      stars: s.repo.stars || 0, forks: s.repo.forks || 0,
      license: s.repo.license || '—', desc: s.repo.desc || { vi: '', en: '' },
    },
    stats: s.stats || { loc: 0, files: 0, modules: 0, contributors: 0, lastCommit: '' },
    langs: (s.langs || []).map(l => ({ name: l.name, pct: Math.round(l.pct), color: l.color })),
    frameworks: s.frameworks || [],
    tree:       s.tree       || [],
    arch:       s.arch       || { nodes: [], edges: [] },
    modules: (s.modules || []).map(m => ({ ...m, purpose: m.purpose || { vi: m.name, en: m.name } })),
    security:(s.security || []).map(f => ({
      ...f, title: f.title || { vi: f.rule, en: f.rule }, why: f.why || { vi: '', en: '' }, refs: f.refs || [],
    })),
    readme: s.readme || '',
  };
}

export default API;
