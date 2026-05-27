import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId, question, kind, contextScope, provider, apiKey, model, scanData } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Câu hỏi trống' }, { status: 400 });
    }

    // 1. Auth check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return NextResponse.json({ error: 'Xác thực thất bại' }, { status: 401 });
    }

    // 2. Load scan data: either from request body (client sends it) or from Supabase
    let analysisData = scanData;
    if (!analysisData && sessionId) {
      const userSupabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: 'Bearer ' + jwt } }
      });
      const { data: scanRecord } = await userSupabase
        .from('scans')
        .select('data, status')
        .eq('id', sessionId)
        .single();

      if (scanRecord && scanRecord.data) {
        analysisData = scanRecord.data;
      }
    }

    // 3. Build context from analysis data
    let contextBlock = '';
    if (analysisData) {
      const repo = analysisData.repo;
      const stats = analysisData.stats;
      const modules = analysisData.modules || [];
      const security = analysisData.security || [];
      const arch = analysisData.arch || { nodes: [], edges: [] };
      const tours = analysisData.tours || [];
      const domains = analysisData.domains || [];
      const tree = analysisData.tree || [];
      const langs = analysisData.langs || [];

      let ctxSections = [];
      ctxSections.push(`=== THÔNG TIN REPOSITORY ===\nTên: ${repo?.owner || ''}/${repo?.name || ''}\nURL: ${repo?.url || ''}\nBranch: ${repo?.branch || 'main'}\nMô tả: ${repo?.desc?.vi || repo?.desc?.en || 'Không có'}\nStars: ${repo?.stars || 0} | Forks: ${repo?.forks || 0}`);
      ctxSections.push(`=== THỐNG KÊ ===\nTổng dòng code (LOC): ${stats?.loc || 0}\nTổng file: ${stats?.files || 0}\nTổng modules: ${stats?.modules || 0}\nNgôn ngữ: ${langs.map(l => `${l.name} (${l.pct}%)`).join(', ')}`);

      // RAG Chunking based on intent (kind)
      const isAudit = kind === 'audit';
      const isLocate = kind === 'locate';
      const isExplain = kind === 'explain' || !kind;

      if (isExplain || isLocate) {
        ctxSections.push(`=== KIẾN TRÚC ===\nTổng nodes: ${arch.nodes?.length || 0}\nCác thành phần chính:\n${arch.nodes?.slice(0, 30).map(n => `  - [${n.type}] ${n.label} (layer: ${n.layer}, path: ${n.filePath || ''})`).join('\n') || 'Không có'}`);
        if (isExplain) {
          ctxSections.push(`Các kết nối import:\n${arch.edges?.slice(0, 20).map(([from, to]) => `  ${from} → ${to}`).join('\n') || 'Không có'}`);
          ctxSections.push(`=== BUSINESS DOMAINS ===\n${domains.slice(0, 5).map(d => `  - ${d.name?.vi || d.name?.en || ''}: actors=${(d.actors || []).join(', ')}`).join('\n') || 'Không có'}`);
        }
      }

      ctxSections.push(`=== MODULES ===\n${modules.slice(0, 15).map(m => `  - ${m.name}: ${m.purpose?.vi || m.purpose?.en || '?'} [${m.lang}, ${m.files} files]`).join('\n') || 'Không có'}`);

      if (isAudit || kind === 'suggest') {
        ctxSections.push(`=== BẢO MẬT ===\n${security.length === 0 ? 'Không có.' : security.slice(0, 15).map(s => `  - [${s.severity?.toUpperCase()}] ${s.title?.vi || s.title?.en || s.rule}: ${s.why?.vi || s.why?.en || ''} (file: ${s.file}, line: ${s.line})`).join('\n')}`);
      }

      if (isExplain || kind === 'suggest') {
        ctxSections.push(`=== GUIDED TOURS ===\n${tours.slice(0, 5).map(t => `  ${t.order}. ${t.title}`).join('\n') || 'Không có'}`);
      }

      if (isLocate || isExplain) {
        ctxSections.push(`=== CÂY THƯ MỤC ===\n${flattenTree(tree).slice(0, 50).join('\n') || 'Không có'}`);
      }

      contextBlock = ctxSections.join('\n\n');
    }

    // 4. Build the final prompt
    const systemPrompt = `Bạn là AI Codebase Intelligence Assistant - trợ lý phân tích mã nguồn thông minh.
Bạn được cung cấp đầy đủ dữ liệu phân tích của một repository GitHub bao gồm: kiến trúc, modules, bảo mật, cây thư mục, và các kết nối giữa các thành phần.

Quy tắc trả lời:
1. Trả lời bằng tiếng Việt hoặc tiếng Anh tùy theo ngôn ngữ của câu hỏi.
2. Luôn tham chiếu đến các file/module cụ thể trong codebase khi có thể.
3. Sử dụng format markdown: **bold**, \`code\`, bullet lists.
4. Nếu người dùng hỏi về kiến trúc, tham chiếu đến các nodes trong Architecture Graph.
5. Nếu người dùng hỏi về bảo mật, tham chiếu đến Security Findings.
6. Nếu người dùng hỏi cách bắt đầu đọc code, tham chiếu đến Guided Tours.
7. Cung cấp file citations khi trả lời (file path và line range).
8. Trả lời chi tiết, rõ ràng, có cấu trúc. Đừng trả lời chung chung.
9. Nếu câu hỏi không liên quan đến codebase, trả lời rằng bạn chỉ hỗ trợ phân tích mã nguồn.

Loại câu hỏi (kind): ${kind || 'explain'}
- explain: Giải thích kiến trúc/cách hoạt động
- locate: Tìm kiếm file/function cụ thể
- audit: Kiểm tra bảo mật
- suggest: Đề xuất cải thiện
- compare: So sánh với repo khác`;

    const userPrompt = `${contextBlock ? `DỮ LIỆU PHÂN TÍCH CODEBASE:\n${contextBlock}\n\n` : ''}CÂU HỎI CỦA NGƯỜI DÙNG:\n${question}`;

    // 5. Call LLM (Gemini or Ollama)
    const geminiKey = apiKey || process.env.GEMINI_API_KEY || '';
    let answerText = '';
    let citations = [];

    if (geminiKey) {
      try {
        const geminiModel = model || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: systemPrompt },
                { text: userPrompt }
              ]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'object',
                properties: {
                  answer_vi: { type: 'string', description: 'Câu trả lời bằng tiếng Việt' },
                  answer_en: { type: 'string', description: 'Answer in English' },
                  citations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        file: { type: 'string' },
                        range: { type: 'string' }
                      },
                      required: ['file', 'range']
                    }
                  }
                },
                required: ['answer_vi', 'answer_en']
              }
            }
          })
        });

        if (response.ok) {
          const json = await response.json();
          let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            const parsed = JSON.parse(text);
            answerText = parsed;
            citations = parsed.citations || [];
          } catch {
            // If JSON parsing fails, use text directly
            answerText = { vi: text, en: text };
          }
        }
      } catch (geminiErr) {
        console.error('Gemini Chat Error:', geminiErr);
      }
    }

    // Fallback to Ollama
    if (!answerText || (typeof answerText === 'object' && !answerText.vi && !answerText.answer_vi)) {
      const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder';
      const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';

      try {
        const res = await fetch(ollamaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: `${systemPrompt}\n\n${userPrompt}\n\nTrả về JSON: {"answer_vi": "...", "answer_en": "...", "citations": [{"file": "...", "range": "..."}]}`,
            stream: false,
            format: 'json'
          })
        });

        if (res.ok) {
          const data = await res.json();
          let text = (data.response || '').replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            const parsed = JSON.parse(text);
            answerText = parsed;
            citations = parsed.citations || [];
          } catch {
            answerText = { vi: text, en: text };
          }
        }
      } catch (ollamaErr) {
        console.error('Ollama Chat Error:', ollamaErr);
      }
    }

    // 6. Format response
    const answer = {
      vi: answerText?.answer_vi || answerText?.vi || 'Không thể tạo câu trả lời. Vui lòng thử lại.',
      en: answerText?.answer_en || answerText?.en || 'Could not generate an answer. Please try again.',
    };

    return NextResponse.json({
      answer,
      citations: citations.filter(c => c.file),
      scope: contextBlock
        ? { vi: 'Dữ liệu phân tích đầy đủ', en: 'Full analysis data' }
        : { vi: 'Chưa có dữ liệu phân tích', en: 'No analysis data available' },
    });

  } catch (error) {
    console.error('Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to flatten tree to list of paths
function flattenTree(tree, prefix = '') {
  const result = [];
  if (!Array.isArray(tree)) return result;
  for (const node of tree) {
    const path = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.type === 'dir') {
      result.push(`📁 ${path}/`);
      result.push(...flattenTree(node.children || [], path));
    } else {
      result.push(`📄 ${path}`);
    }
  }
  return result;
}
