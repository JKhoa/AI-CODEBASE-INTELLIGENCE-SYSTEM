const { adaptSessionForUI } = require('./src/lib/api.js');

const raw = {
  status: 'scanning',
  stage: 'parsing',
  repo: { owner: 'expressjs', name: 'express', url: 'https://github.com/expressjs/express', branch: 'main', desc: { vi: '', en: '' }, stars: 0, forks: 0 },
  tree: [],
  langs: [],
  stats: { files: 20, loc: 0, modules: 0, contributors: 1 },
  arch: { nodes: [], edges: [] },
  modules: [], security: [], tours: [], domains: [], readme: ''
};

try {
  const adapted = adaptSessionForUI(raw);
  console.log("Adapted:", adapted);
} catch (e) {
  console.error("Crash:", e);
}
