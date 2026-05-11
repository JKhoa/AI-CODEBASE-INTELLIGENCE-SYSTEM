# AI Codebase Intelligence

Phân tích repository GitHub bằng AI: cây thư mục có chú thích, sơ đồ kiến trúc,
phát hiện bảo mật 2 lớp (heuristic + LLM), Q&A có RAG, so sánh giữa các repo,
sinh tài liệu Markdown.

## Cấu trúc

```
web/                    Next.js 14 frontend (App Router, Tailwind, JSX)
  app/                  routes
  src/                  components / context / lib
server.py               FastAPI backend
analyze.py              AST + arch graph + dep audit + doc generator
llm.py                  LLM providers (Anthropic / OpenAI / Ollama) + retrieval
requirements.txt
.cache/                 session JSON store

# (legacy CDN-only setup vẫn còn để tham khảo)
index.html
src/*.jsx
```

## Chạy

### Backend
```bash
pip install -r requirements.txt
python server.py
# → http://localhost:8000  (REST API)
```

### Frontend (Next.js)
```bash
cd web
npm install
npm run dev
# → http://localhost:3000  (UI; /api/* proxy về :8000)
```

Production:
```bash
cd web
npm run build && npm run start
```

## Endpoints (FastAPI)

| Method | Path                                  | Mô tả                                             |
|-------:|---------------------------------------|---------------------------------------------------|
| POST   | `/api/scan`                           | Tạo session mới `{url, token?}`                   |
| GET    | `/api/scan/{id}`                      | Snapshot session                                  |
| GET    | `/api/scan/{id}/tree`                 | Cây thư mục đầy đủ                                |
| GET    | `/api/scan/{id}/file?path=…`          | Nội dung file utf-8                               |
| GET    | `/api/scan/{id}/readme`               | README markdown                                   |
| GET    | `/api/scan/{id}/doc.md`               | Sinh markdown documentation                       |
| GET    | `/api/scan/{id}/dependencies`         | Deps + OSV.dev CVE audit                          |
| GET    | `/api/library`                        | Tất cả session đã quét                            |
| DELETE | `/api/scan/{id}`                      | Xóa session                                       |
| POST   | `/api/chat`                           | Q&A có RAG + LLM                                  |
| GET    | `/api/llm/config`                     | LLM defaults phía server                          |
| POST   | `/api/llm/config`                     | Set provider/key/model                            |
| POST   | `/api/llm/test`                       | Ping LLM 1-token                                  |
| GET    | `/api/compare?a=&b=`                  | So sánh 2 session                                 |

## Routes (Next.js)

```
/                              Landing — paste URL GitHub
/library                       danh sách session
/scan/[id]                     workspace 3 cột (tree, tabs, assistant)
/compare/[a]/[b]               so sánh 2 repo
/settings                      LLM provider + key + theme + lang
```

## Cấu hình LLM

Mở `/settings`, chọn provider (Anthropic / OpenAI / Ollama), dán key, bấm
**Ping LLM** để test, **Save**. Key lưu trong localStorage trình duyệt và gửi
kèm mỗi lần chat. Ollama yêu cầu daemon chạy local trên `:11434`.
