// Removed GoogleGenerativeAI import as we are switching to Ollama

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
  "internal": "backend", "lib": "backend", "db": "data", "infra": "infra",
  "config": "tooling", "tooling": "tooling", "docs": "docs", "document": "docs"
};

export function buildFileTree(files) {
  const root = { type: 'dir', name: 'root', children: [] };
  
  files.forEach(f => {
    const parts = f.path.split('/');
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      
      if (isLast) {
        const ext = part.split('.').pop().toLowerCase();
        current.children.push({
          type: 'file',
          name: part,
          path: f.path,
          lang: f.lang || ext,
          loc: f.loc || 0,
          size: f.size || 0,
          role: f.role || { vi: f.path, en: f.path }
        });
      } else {
        let dir = current.children.find(c => c.type === 'dir' && c.name === part);
        if (!dir) {
          dir = { type: 'dir', name: part, children: [] };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  });
  
  const sortTree = (node) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortTree);
    }
  };
  sortTree(root);
  return root.children;
}

export function buildArchGraph(files, importsByFile) {
  const nodes = [];
  const edges = [];
  const fileSet = new Set(files.map(f => f.path));
  
  files.forEach(f => {
    const ext = f.path.split('.').pop().toLowerCase();
    const name = f.path.split('/').pop();
    
    let type = 'file';
    let idPrefix = 'file:';
    if (['json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'env'].includes(ext) || name.includes('config') || name.startsWith('.')) {
      type = 'config';
      idPrefix = 'config:';
    } else if (['md', 'txt', 'pdf', 'rst'].includes(ext)) {
      type = 'document';
      idPrefix = 'document:';
    } else if (f.path.includes('docker') || f.path.includes('k8s') || f.path.includes('compose')) {
      type = 'service';
      idPrefix = 'service:';
    }
    
    const id = idPrefix + f.path;
    let layer = 'backend';
    const pathLower = f.path.toLowerCase();
    for (const [key, value] of Object.entries(LAYER_HINTS)) {
      if (pathLower.includes(key)) {
        layer = value;
        break;
      }
    }
    
    const loc = f.loc || Math.floor(Math.random() * 150) + 10;
    
    nodes.push({
      id,
      label: name,
      type,
      name,
      filePath: f.path,
      summary: f.role?.[ 'en' ] || `Codebase component handling ${name}`,
      tags: [ext, layer, type],
      complexity: loc < 50 ? 'simple' : loc < 200 ? 'moderate' : 'complex',
      layer,
      sub: `${loc} lines · ${ext}`
    });
  });
  
  Object.entries(importsByFile).forEach(([fpath, deps]) => {
    const srcId = 'file:' + fpath;
    
    deps.forEach(d => {
      let destPath = null;
      if (d.startsWith('.')) {
        const parts = fpath.split('/');
        parts.pop();
        const depParts = d.split('/');
        depParts.forEach(dp => {
          if (dp === '..') parts.pop();
          else if (dp !== '.') parts.push(dp);
        });
        const resolved = parts.join('/');
        
        for (const f of fileSet) {
          if (f.startsWith(resolved)) {
            destPath = f;
            break;
          }
        }
      } else {
        for (const f of fileSet) {
          if (f.endsWith(d) || f.includes('/' + d)) {
            destPath = f;
            break;
          }
        }
      }
      
      if (destPath && destPath !== fpath) {
        edges.push([srcId, 'file:' + destPath]);
      }
    });
  });
  
  return { nodes, edges };
}


// ---------------------------------------------------------------------------
// 3. GitHub API Fetcher & LLM Summarize
// ---------------------------------------------------------------------------

export async function fetchGithubFileContent(owner, repo, path, branch = 'main', token = '') {
  const headers = {};
  if (token) headers['Authorization'] = `token ${token}`;
  
  // Try raw.githubusercontent.com first (fastest, no rate limit issues)
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) return await res.text();
  } catch (e) {
    if (e.name !== 'AbortError') console.error(`Error fetching raw ${path}:`, e.message);
  }
  
  // Fallback to API (slower but more reliable)
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(apiUrl, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.content && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf8');
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError') console.error(`Error fetching api ${path}:`, e.message);
  }
  return null;
}



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

async function callLLM(prompt, geminiKey, timeoutMs = 120000) {
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 4096 }
        })
      });
      clearTimeout(timeout);
      if (response.ok) {
        const json = await response.json();
        let text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Robust JSON extraction
        try {
          let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
          }
          return JSON.parse(cleaned);
        } catch (e) {
          console.error("Gemini JSON parse error:", e, "Text:", text.substring(0, 200));
          return { _error: "Failed to parse JSON", _raw: text.substring(0, 500) };
        }
      } else {
        const errText = await response.text();
        console.error("Gemini API non-OK:", response.status, errText);
        return { _error: `API Error ${response.status}: ${errText}` };
      }
    } catch (err) {
      console.error("Gemini Error, fallback to Ollama:", err.name === 'AbortError' ? 'Timeout' : err.message);
      return { _error: `Request Error: ${err.message}` };
    }
  }

  const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5-coder";
  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs + 15000);
    const res = await fetch(ollamaUrl, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ model: ollamaModel, prompt, stream: false, format: "json" })
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      let text = (data.response || "").replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { _error: "Ollama JSON parse error", _raw: text.substring(0, 500) };
      }
    } else {
      return { _error: `Ollama API Error ${res.status}` };
    }
  } catch (err) {
    console.error("Ollama Error:", err.name === 'AbortError' ? 'Timeout' : err.message);
    return { _error: `Ollama Error: ${err.message}` };
  }
  return null;
}

export async function runGeminiAnalysis(geminiKey, blobs, readmeContent = "", codeSnippet = "") {
  // Limit file list for faster processing
  const fileList = blobs.map(b => b.path).slice(0, 100).join('\n');
  const readmeSnippet = readmeContent ? `\n\nĐây là nội dung file README của dự án:\n---\n${readmeContent.slice(0, 3000)}\n---\n` : "";
  const codeContext = codeSnippet ? `\n\nMột số đoạn code thực tế từ dự án để hiểu rõ logic:\n---\n${codeSnippet.slice(0, 30000)}\n---\n` : "";
  
  // Agent 1: Architecture & Domains
  const prompt1 = `Bạn là chuyên gia phân tích kiến trúc phần mềm. Phân tích dự án dựa trên tài liệu và mã nguồn sau:${readmeSnippet}${codeContext}\nDanh sách tệp:\n${fileList}\n\nTrả về JSON CHÍNH XÁC theo cấu trúc sau (KHÔNG text ngoài JSON):\n{\n  "modules": [{"name":"string","purpose":{"vi":"string","en":"string"},"lang":"string","files":0,"fns":0,"risk":"Low|Medium|High","layer":"frontend|backend|infra|data|tooling|docs"}],\n  "domains": [{"name":{"vi":"string","en":"string"},"actors":["string"],"steps":[{"from":"string","to":"string","label":"string"}]}]\n}`;
  
  // Agent 2: Security & Tours
  const prompt2 = `Bạn là chuyên gia bảo mật và tài liệu phần mềm. Phân tích dự án dựa trên tài liệu và mã nguồn sau:${readmeSnippet}${codeContext}\nDanh sách tệp:\n${fileList}\n\nTrả về JSON CHÍNH XÁC theo cấu trúc sau (KHÔNG text ngoài JSON):\n{\n  "security": [{"id":"SEC-001","severity":"high|medium|low","confirmed":true,"falsePositive":false,"title":{"vi":"string","en":"string"},"file":"string","line":"string","rule":"string","why":{"vi":"string","en":"string"},"code":"string","suggested":"string","refs":["CWE-XX"]}],\n  "tours": [{"order":1,"title":"string","description":{"vi":"string","en":"string"},"nodeIds":["file:path"]}]\n}`;

  // Agent 3: AI Assessment (Practical examples, Contradictions, QA)
  const prompt3 = `Bạn là Chuyên gia Kiến trúc Phần mềm cấp cao. ĐỌC KỸ MÃ NGUỒN VÀ TÀI LIỆU SAU ĐỂ HIỂU CHÍNH XÁC NGHIỆP VỤ THỰC TẾ CỦA REPO:${readmeSnippet}${codeContext}\nDanh sách tệp:\n${fileList}\n\nTrả về JSON CHÍNH XÁC theo cấu trúc sau:\n{\n  "beginnerGuide": {"practicalExample":{"vi":"Giải thích chuyên nghiệp, rõ ràng về cách ứng dụng này hoạt động, các chức năng cốt lõi là gì, và cách người dùng sử dụng nó trong thực tế. KHÔNG dùng ví von, KHÔNG so sánh ẩn dụ. Viết như tài liệu chuyên ngành nhưng dễ hiểu","en":"string"},"simplePurpose":{"vi":"Giải thích ngắn gọn, đi thẳng vào vấn đề trọng tâm repo này giải quyết bài toán gì","en":"string"},"coreValue":[{"vi":"string","en":"string"}]},\n  "contradictions": [{"type":"high|medium|low","vi":"string","en":"string"}],\n  "suitability": {"goodFor":[{"vi":"string","en":"string"}],"badFor":[{"vi":"string","en":"string"}]},\n  "categories": [{"id":"string","name":{"vi":"string","en":"string"},"qa":[{"q":"Câu hỏi phân tích chuyên sâu (vd: Luồng xử lý dữ liệu hoạt động ra sao?)","a":{"vi":"Câu trả lời chuyên nghiệp, tường tận, mổ xẻ kỹ thuật","en":"string"},"icon":"target","tags":["string"]}]}]\n}`;

  // Sequential Execution to avoid Rate Limits (429 Too Many Requests)
  const res1 = await callLLM(prompt1, geminiKey);
  await new Promise(r => setTimeout(r, 1000)); // 1s delay
  const res2 = await callLLM(prompt2, geminiKey);
  await new Promise(r => setTimeout(r, 1000)); // 1s delay
  const res3 = await callLLM(prompt3, geminiKey);

  return {
    modules: res1?._error ? [] : (res1?.modules || []),
    domains: res1?._error ? [] : (res1?.domains || []),
    security: res2?._error ? [] : (res2?.security || []),
    tours: res2?._error ? [] : (res2?.tours || []),
    aiAssessment: res3?._error ? {
      beginnerGuide: {
        practicalExample: { vi: `Lỗi AI: ${res3._error}. Chi tiết: ${res3._raw || ''}`, en: "AI Error" },
        simplePurpose: { vi: "Không thể phân tích do lỗi API hoặc cấu trúc dữ liệu", en: "Error" },
        coreValue: []
      },
      categories: []
    } : res3 || null
  };
}