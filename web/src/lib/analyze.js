import { GoogleGenerativeAI } from '@google/generative-ai';

// ---------------------------------------------------------------------------
// 1. Import extraction (Mimicking analyze.py regex patterns in Python)
// ---------------------------------------------------------------------------
const RE_JS_IMPORT = /(?:import\s+(?:.+?\s+from\s+)?|require\s*\(\s*)['"]([^'"]+)['"]/g;
const RE_GO_IMPORT = /import\s*\(\s*([^)]+)\)|import\s+['"]([^'"]+)['"]/g;
const RE_RUST_USE = /^\s*use\s+([\w:\{\},\s]+);/gm;

export function extractImports(path, content) {
  const ext = path.split('.').pop().toLowerCase();
  const out = [];
  
  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(ext)) {
    let match;
    while ((match = RE_JS_IMPORT.exec(content)) !== null) out.push(match[1]);
  } else if (ext === 'go') {
    let match;
    while ((match = RE_GO_IMPORT.exec(content)) !== null) {
      if (match[1]) {
        match[1].split('\n').forEach(line => {
          const m2 = line.match(/"([^"]+)"/);
          if (m2) out.push(m2[1]);
        });
      } else if (match[2]) out.push(match[2]);
    }
  } else if (ext === 'rs') {
    let match;
    while ((match = RE_RUST_USE.exec(content)) !== null) {
      const first = match[1].split('::')[0].trim();
      if (first) out.push(first);
    }
  }
  // Python AST parsing is skipped for simplicity. Regex can be added if needed.
  return out;
}

// ---------------------------------------------------------------------------
// 2. Build architecture graph
// ---------------------------------------------------------------------------
const LAYER_HINTS = {
  "frontend": "frontend", "web": "frontend", "ui": "frontend", "client": "frontend",
  "app": "frontend", "apps": "frontend", "components": "frontend", "pages": "frontend",
  "src": "backend", "backend": "backend", "server": "backend", "api": "backend",
  "internal": "backend", "lib": "backend", "db": "data", "infra": "infra"
};

function topModule(path) {
  const parts = path.split('/');
  return parts.length === 1 ? path : parts[0];
}

export function buildArchGraph(files, importsByFile) {
  const fileToTop = {};
  const sizes = {};
  const langs = {};

  files.forEach(f => {
    const top = topModule(f.path);
    fileToTop[f.path] = top;
    sizes[top] = (sizes[top] || 0) + 1;
    const lang = f.path.split('.').pop().toLowerCase();
    if (!langs[top]) langs[top] = {};
    langs[top][lang] = (langs[top][lang] || 0) + 1;
  });

  const validModules = new Set(Object.values(fileToTop));
  const edges = {};

  // Build edges
  Object.entries(importsByFile).forEach(([fpath, deps]) => {
    const srcTop = fileToTop[fpath];
    if (!srcTop) return;
    
    deps.forEach(d => {
      const head = d ? d.split('/')[0].split('.')[0].replace(/^\./, '') : '';
      if (!head || head === srcTop) return;
      if (validModules.has(head)) {
        const key = `${srcTop}__$$__${head}`;
        edges[key] = (edges[key] || 0) + 1;
      }
    });
  });

  // Top modules
  const topModules = Object.keys(sizes).sort((a, b) => sizes[b] - sizes[a]).slice(0, 9);
  
  const nodes = topModules.map((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const mostCommonLang = Object.keys(langs[m] || {}).sort((a, b) => langs[m][b] - langs[m][a])[0] || 'txt';
    return {
      id: m,
      label: m,
      sub: `${sizes[m]} files · ${mostCommonLang}`,
      layer: LAYER_HINTS[m.toLowerCase()] || "backend",
      x: 60 + col * 240,
      y: 40 + row * 140
    };
  });

  const edgesFiltered = Object.keys(edges)
    .map(key => key.split('__$$__'))
    .filter(([a, b]) => topModules.includes(a) && topModules.includes(b));

  return { nodes, edges: edgesFiltered };
}

// ---------------------------------------------------------------------------
// 3. GitHub API Fetcher & LLM Summarize
// ---------------------------------------------------------------------------

export async function fetchGithubTree(owner, repo, tokenStr) {
  const headers = {};
  if (tokenStr) headers['Authorization'] = `token ${tokenStr}`;
  
  // 1. Get branch info
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) throw new Error("Không thể tìm thấy repository");
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || 'main';

  // 2. Get tree
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
  if (!treeRes.ok) throw new Error("Không thể lấy file tree");
  const treeData = await treeRes.json();
  
  // Filter blobs only
  const blobs = (treeData.tree || []).filter(i => i.type === 'blob');
  
  return { repoData, blobs };
}

export async function runGeminiAnalysis(geminiKey, blobs) {
  if (!geminiKey) return { modules: [], security: [] };
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Bạn là chuyên gia phân tích kiến trúc phần mềm. 
Hãy đọc danh sách các tệp tin trong repository này:
${blobs.map(b => b.path).slice(0, 100).join('\n')}

Vui lòng trả về dưới định dạng JSON với cấu trúc:
{
  "modules": [ { "name": "Auth", "purpose": {"vi": "Xác thực", "en":"Authentication"} } ],
  "security": []
}`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini Parse Error:", err);
    return { modules: [], security: [] };
  }
}