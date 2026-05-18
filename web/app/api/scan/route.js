import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchGithubTree, buildArchGraph, extractImports, runGeminiAnalysis } from '@/src/lib/analyze';

// Initialize Supabase admin client for server-side API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const body = await req.json();
    const { url, token, workspaceId } = body;
    
    // 1. Validate Input
    if (!url || !url.includes('github.com')) {
      return NextResponse.json({ error: 'URL GitHub không hợp lệ' }, { status: 400 });
    }

    // Parse owner and repo from URL
    const parts = url.split('github.com/')[1].split('/');
    const repo_owner = parts[0];
    const repo_name = parts[1].replace('.git', '');

    // 2. Fetch User Session from Headers (Authorization: Bearer <token>)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return NextResponse.json({ error: 'Xác thực thất bại' }, { status: 401 });
    }

    // Generate unique ID for scan
    const scanId = Math.random().toString(36).substring(2, 10);

    // 3. Insert Initial Queued Record into Supabase
    const { data: scanRecord, error: insertError } = await supabase
      .from('scans')
      .insert({
        id: scanId,
        user_id: user.id,
        workspace_id: workspaceId || null,
        repo_owner,
        repo_name,
        status: 'scanning',
        data: { tree: [], langs: [], stats: { files: 0 } }
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. (Background) Do Github Fetch and LLM Analysis
    // Next.js API Routes have a timeout limit (typically 10s or 60s on Vercel), but since we send 
    // NextResponse immediately and do the work async in node, it behaves like a worker for small repos.
    
    (async () => {
      try {
        const ghToken = process.env.GITHUB_TOKEN || '';
        const geminiKey = process.env.GEMINI_API_KEY || '';

        // Fetch Repo structure
        const { repoData, blobs } = await fetchGithubTree(repo_owner, repo_name, ghToken);

        // Dummy/simplified dependency inference until full content read logic is added
        let files = blobs.map(b => ({ path: b.path, type: b.type }));
        let importsByFile = {}; // would need to fetch file contents for real extraction
        
        const arch = buildArchGraph(files, importsByFile);
        
        // Pass to Gemini
        const aiOutput = await runGeminiAnalysis(geminiKey, blobs);

        const analysisData = {
          repo: {
            owner: repo_owner, name: repo_name, url: repoData.html_url,
            branch: repoData.default_branch, desc: { vi: repoData.description, en: repoData.description },
            stars: repoData.stargazers_count, forks: repoData.forks_count
          },
          tree: files,
          arch: arch,
          langs: [{ name: repoData.language || "Unknown", pct: 100, color: "#ccc" }],
          stats: { loc: files.length * 50, files: files.length, lastCommit: repoData.updated_at },
          readme: "# " + repo_name + "\n\nScan hoàn tất tự động bằng Next.js API Roututes",
          modules: aiOutput.modules || [],
          security: aiOutput.security || []
        };

        // Update Scan Record
        await supabase.from('scans').update({
          status: 'done',
          data: analysisData,
          finished_at: new Date().toISOString()
        }).eq('id', scanId);

      } catch (analysisErr) {
        console.error("Analysis Worker Error:", analysisErr);
        await supabase.from('scans').update({ status: 'failed' }).eq('id', scanId);
      }
    })();

    // Return the response immediately so frontend shows "queued/scanning"
    return NextResponse.json({ id: scanId, status: 'queued' });

  } catch (error) {
    console.error('Scan Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
