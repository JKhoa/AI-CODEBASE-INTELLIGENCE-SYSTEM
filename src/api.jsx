// Frontend API client.
// Talks to the FastAPI backend in server.py. When window.API_BASE is empty
// or the backend is offline the helpers fall back to the mock data so the
// UI keeps working stand-alone.

const API_BASE = () => (typeof window !== 'undefined' ? (window.API_BASE || '') : '');

async function apiFetch(path, opts = {}) {
  const url = API_BASE() + path;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error('API ' + res.status + ': ' + text.slice(0, 200));
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const API = {
  available: false,            // probed on first call
  _probed:   false,

  async probe() {
    if (this._probed) return this.available;
    this._probed = true;
    try {
      // 1.5s timeout — if backend is down we want the fallback fast.
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 1500);
      const r = await fetch(API_BASE() + '/api/library', { signal: ctrl.signal });
      clearTimeout(tm);
      this.available = r.ok;
    } catch (_) {
      this.available = false;
    }
    return this.available;
  },

  async startScan(url, token) {
    return apiFetch('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ url, token: token || null }),
    });
  },
  async getScan(sid)     { return apiFetch('/api/scan/' + encodeURIComponent(sid)); },
  async getTree(sid)     { return apiFetch('/api/scan/' + encodeURIComponent(sid) + '/tree'); },
  async getFile(sid, p)  { return apiFetch('/api/scan/' + encodeURIComponent(sid) + '/file?path=' + encodeURIComponent(p)); },
  async getReadme(sid)   { return apiFetch('/api/scan/' + encodeURIComponent(sid) + '/readme'); },
  async listLibrary()    { return apiFetch('/api/library'); },
  async deleteScan(sid)  { return apiFetch('/api/scan/' + encodeURIComponent(sid), { method: 'DELETE' }); },
  async chat(payload)    { return apiFetch('/api/chat', { method: 'POST', body: JSON.stringify(payload) }); },
  async compare(a, b)    { return apiFetch('/api/compare?a=' + encodeURIComponent(a) + '&b=' + encodeURIComponent(b)); },
  async docMd(sid, lang) { return apiFetch('/api/scan/' + encodeURIComponent(sid) + '/doc.md?lang=' + (lang || 'vi')); },
  async deps(sid)        { return apiFetch('/api/scan/' + encodeURIComponent(sid) + '/dependencies'); },
  async getLlmCfg()      { return apiFetch('/api/llm/config'); },
  async setLlmCfg(cfg)   { return apiFetch('/api/llm/config', { method: 'POST', body: JSON.stringify(cfg) }); },
  async testLlm(cfg)     { return apiFetch('/api/llm/test',   { method: 'POST', body: JSON.stringify(cfg || {}) }); },
};

// LLM credentials kept in localStorage so they're sent with every chat request.
const LLM_STORE_KEY = 'llm.cfg.v1';
function loadLlmCfg() {
  try { return JSON.parse(localStorage.getItem(LLM_STORE_KEY)) || {}; }
  catch (_) { return {}; }
}
function saveLlmCfg(cfg) {
  try { localStorage.setItem(LLM_STORE_KEY, JSON.stringify(cfg || {})); } catch (_) {}
}
window.loadLlmCfg = loadLlmCfg;
window.saveLlmCfg = saveLlmCfg;

// ----- Adapter: transform a server session into the shape SCAN_DONE uses ---
function adaptSessionForUI(s, lang = 'vi') {
  if (!s) return null;
  return {
    id: s.id,
    status: s.status,
    stage:  s.stage,
    error:  s.error,
    repo: {
      url:    s.repo.url,
      owner:  s.repo.owner,
      name:   s.repo.name,
      branch: s.repo.branch || 'main',
      commit: (s.repo.commit || '').slice(0, 7),
      stars:  s.repo.stars  || 0,
      forks:  s.repo.forks  || 0,
      license: s.repo.license || '—',
      desc:   s.repo.desc   || { vi: '', en: '' },
    },
    stats: s.stats || { loc: 0, files: 0, modules: 0, contributors: 0, lastCommit: '' },
    langs: (s.langs || []).map(l => ({ name: l.name, pct: Math.round(l.pct), color: l.color })),
    frameworks: s.frameworks || [],
    tree:       s.tree       || [],
    modules:    (s.modules || []).map(m => ({
      ...m,
      purpose: m.purpose || { vi: m.name, en: m.name },
    })),
    security:   (s.security || []).map(f => ({
      ...f,
      title: f.title || { vi: f.rule, en: f.rule },
      why:   f.why   || { vi: '', en: '' },
      refs:  f.refs  || [],
    })),
    readme: s.readme || '',
  };
}

window.API = API;
window.adaptSessionForUI = adaptSessionForUI;
