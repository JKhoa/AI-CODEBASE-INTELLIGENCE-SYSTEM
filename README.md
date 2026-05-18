# AI Codebase Intelligence — SaaS

Phân tích repository GitHub bằng AI: cây thư mục có chú thích, sơ đồ kiến trúc,
phát hiện bảo mật 2 lớp (heuristic + LLM), Q&A có RAG, so sánh giữa các repo,
sinh tài liệu Markdown — **kèm full multi-tenant SaaS**: auth, workspaces,
team, API keys, plan-based quota.

## Cấu trúc

```
web/                Next.js 14 frontend (App Router, Tailwind)
  app/              routes (/, /login, /signup, /dashboard, /library,
                            /scan/[id], /compare/[a]/[b], /settings/*)
  src/              components / context (App + Auth) / lib

server.py           FastAPI backend (auth, scan, chat, workspaces, billing)
db.py               SQLAlchemy models + plan limits + SQLite engine
auth.py             JWT, password (PBKDF2), API-key auth, FastAPI deps
analyze.py          AST + arch graph + dep audit + doc generator
llm.py              LLM providers (Anthropic / OpenAI / Ollama) + retrieval
requirements.txt
.cache/             saas.db (SQLite) + session blobs
```

## Chạy

### Backend
```bash
pip install -r requirements.txt
python server.py          # http://localhost:8000
```
DB tự tạo tại `.cache/saas.db` ở lần chạy đầu.

### Frontend
```bash
cd web
npm install
npm run dev               # http://localhost:3000  (/api/* proxy → :8000)
```

Production:
```bash
cd web && npm run build && npm run start
```

### Biến môi trường (tuỳ chọn)
- `APP_SECRET`     — secret ký JWT (đổi trong production)
- `LLM_PROVIDER`   — `anthropic` | `openai` | `ollama`
- `LLM_API_KEY`    — server-side default LLM key (per-user vẫn override được)
- `LLM_MODEL`      — model id mặc định

## SaaS flow

1. Mở `/signup` → tạo tài khoản (email + password). Tự sinh **Personal workspace**.
2. `/dashboard` hiển thị usage, plan, các shortcut.
3. `/` (Landing) paste URL repo → tạo scan (gắn vào workspace mặc định).
4. `/library` hiển thị mọi scan trong các workspace mà user là thành viên.
5. `/settings/team` mời thành viên (sinh invite token), `/accept-invite?token=…`
   để tham gia.
6. `/settings/api-keys` tạo programmatic API key (xem **API** ở dưới).
7. `/settings/billing` chuyển plan **Free / Pro / Team** (mock — không Stripe).
8. `/settings/account` xem profile, logout.

## Plans & quota

| Plan  | Scan/tháng | Chat/tháng | Members | API keys |
|-------|-----------:|-----------:|--------:|---------:|
| Free  |         10 |        100 |       1 |        1 |
| Pro   |        200 |      4 000 |       5 |        5 |
| Team  |     2 000  |     40 000 |      25 |       25 |

Quota enforce server-side; vượt cap → HTTP 402.

## API endpoints

### Auth
| Method | Path                       | Body / mô tả                          |
|-------:|----------------------------|---------------------------------------|
| POST   | `/api/auth/signup`         | `{email, password, name?}` → token    |
| POST   | `/api/auth/login`          | `{email, password}` → token           |
| GET    | `/api/auth/me`             | user + workspaces                     |
| POST   | `/api/auth/plan`           | `{plan}` đổi plan (free/pro/team)     |

### Dashboard / workspace / team
| Method | Path                                              |
|-------:|---------------------------------------------------|
| GET    | `/api/dashboard`                                  |
| GET    | `/api/plans`                                      |
| GET    | `/api/workspaces`                                 |
| GET    | `/api/workspaces/{wid}/members`                   |
| POST   | `/api/workspaces/{wid}/invite`  `{email, role}`   |
| DELETE | `/api/workspaces/{wid}/members/{member_id}`       |
| POST   | `/api/invites/accept`            `{token}`        |

### API keys
| Method | Path                       | Mô tả                       |
|-------:|----------------------------|-----------------------------|
| GET    | `/api/api-keys`            | List                        |
| POST   | `/api/api-keys`            | `{name}` → trả raw key 1 lần |
| DELETE | `/api/api-keys/{id}`       | Revoke                      |

### Scans (cần auth)
| Method | Path                                  |
|-------:|---------------------------------------|
| POST   | `/api/scan`           `{url, token?, workspaceId?}` |
| GET    | `/api/scan/{id}`                      |
| GET    | `/api/scan/{id}/tree`                 |
| GET    | `/api/scan/{id}/file?path=…`          |
| GET    | `/api/scan/{id}/readme`               |
| GET    | `/api/scan/{id}/doc.md?lang=vi`       |
| GET    | `/api/scan/{id}/dependencies`         |
| POST   | `/api/scan/{id}/share`  `{visibility}`|
| DELETE | `/api/scan/{id}`                      |
| GET    | `/api/library`                        |
| POST   | `/api/chat`                           |
| GET    | `/api/compare?a=&b=`                  |

### Auth header
Bearer JWT **hoặc** API key (gửi qua `Authorization: Bearer <token-or-key>`
hoặc `X-Api-Key: <key>`). API keys cho phép tự động hoá CI/CD.

### Public share
Scan có `visibility="public"` (xem `POST /api/scan/{id}/share`) lấy được
qua link có `?share=<shareToken>`, không cần đăng nhập.

## Cấu hình LLM

Mở `/settings`, chọn provider (Anthropic / OpenAI / Ollama), dán key, bấm
**Ping LLM** để test, **Save**. Key lưu trong localStorage trình duyệt và gửi
kèm mỗi lần chat. Ollama yêu cầu daemon chạy local trên `:11434`.

## Notes

- DB file `.cache/saas.db` tự khởi tạo. Xoá file = reset toàn bộ user/scan.
- Cookies không dùng — JWT lưu trong localStorage (key `auth.token.v1`).
- Bcrypt thay bằng PBKDF2-HMAC-SHA256 (200k iterations) để tránh dependency.
- Không có Stripe — đổi plan trên `/settings/billing` chỉ cập nhật DB.
