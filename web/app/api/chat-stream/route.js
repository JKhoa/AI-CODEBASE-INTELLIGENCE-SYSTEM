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

    const systemPrompt = `Bạn là AI Codebase Intelligence Assistant - trợ lý phân tích mã nguồn thông minh.
Bạn được cung cấp đầy đủ dữ liệu phân tích của một repository GitHub.

Quy tắc trả lời:
1. Trả lời bằng tiếng Việt hoặc tiếng Anh.
2. Trả lời bằng MARKDOWN thuần túy (Plain Markdown). KHÔNG dùng JSON. KHÔNG bọc trong \`\`\`json.
3. Luôn tham chiếu đến các file/module cụ thể trong codebase khi có thể.
4. Trả lời chi tiết, rõ ràng, có cấu trúc.

Loại câu hỏi (kind): ${kind || 'explain'}`;

    const userPrompt = `${contextBlock ? `DỮ LIỆU PHÂN TÍCH:\n${contextBlock}\n\n` : ''}CÂU HỎI:\n${question}`;

    const geminiKey = apiKey || process.env.GEMINI_API_KEY || '';

    if (geminiKey) {
      try {
        const geminiModel = model || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${geminiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }, { text: userPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        });

        if (response.ok) {
          // Return the SSE stream directly!
          return new Response(response.body, {
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
          });
        }
      } catch (err) {
        console.error('Gemini Stream Error:', err);
      }
    }

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"text": "Lỗi: Không thể kết nối với AI Model."}\n\ndata: [DONE]\n\n'));
        controller.close();
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });

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
