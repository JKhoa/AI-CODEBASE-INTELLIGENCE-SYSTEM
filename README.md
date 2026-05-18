# AI Codebase Intelligence — SaaS

Hệ thống phân tích Repository GitHub tự động bằng AI. Cung cấp tính năng bóc tách cây thư mục (AST), sinh sơ đồ kiến trúc, phát hiện lỗi bảo mật và sinh tài liệu Markdown. 
Tích hợp hệ thống SaaS đầy đủ: Authentication, Workspaces Database, Team, Quota limits.

## 🚀 Kiến trúc hệ thống mới
- **Framework:** 100% Next.js 14 (App Router) cho cả Frontend (React/Tailwind) và Backend (Serverless API).
- **Cơ sở dữ liệu & Xác thực (BaaS):** Supabase (PostgreSQL & Supabase Auth).
- **Containerize:** Dockerized (web/Dockerfile build custom standalone size-optimized).
- **AI Provider:** Google Gemini API.
- **Deploy:** Render.com thông qua CI/CD của GitHub.

## 📂 Cấu trúc thư mục
`	ext
web/
  app/              Next.js Pages & Backend Serverless API Routes (/api/*)
  src/              React Components, Context (AuthContext), Utilities & Logic (analyze.js)
  Dockerfile        Cấu hình Docker để build Image cho Production
  package.json      Quản lý thư viện dự án
`

## 🛠 Hướng dẫn khởi chạy cục bộ (Local)

**1. Yêu cầu môi trường:**
- Node.js >= 20.x
- Tài khoản và Dự án trên Supabase
- API Key từ Google AI Studio (Gemini)

**2. Cài đặt:**
`ash
cd web
npm install
`

**3. Cấu hình biến môi trường:**
Tạo file .env.local ở thư mục web/ và bổ sung:
`env
NEXT_PUBLIC_SUPABASE_URL=https://<your_id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
GEMINI_API_KEY=<your_gemini_api_key>
GITHUB_TOKEN=<your_github_token_de_chong_rate_limit> # (Tùy chọn)
`

**4. Chạy môi trường phát triển (Dev):**
`ash
npm run dev
# Truy cập cổng http://localhost:3000
`

## 🐳 Docker Deployment
Ứng dụng có thể được đóng gói và chạy thông qua nền tảng Container:
`ash
cd web
docker build -t ai-codebase-app .
docker run -p 3000:3000 --env-file .env.local ai-codebase-app
`

## 📝 Danh sách yêu cầu học thuật đã đáp ứng
1. ✅ **Next.js (App Router):** Triển khai toàn bộ Full-stack Javascript. Lược bỏ hoàn toàn Backend Python cũ.
2. ✅ **Supabase-only backend:** Dùng Supabase Auth thay JWT thủ công và Supabase PostgreSQL thay cho SQLite.
3. ✅ **Docker:** Sử dụng Dockerfile 3 stages để optimize image size của Next.js (Standalone).
4. ✅ **Nền tảng Live Deployment:** Ứng dụng đã chạy môi trường trên Internet, build Container Image tự động qua Render.com.
5. ✅ **Lịch sử GitHub:** Quản lý version control, history code cho quy trình migrate và debug CI/CD chặt chẽ.
6. ✅ **Tích hợp API/AI:** Sử dụng GitHub API kéo mã nguồn + Google Gemini API phân tích và truy vấn.
