import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    // For now we will await a basic operation to demonstrate the rewrite
    // In production, this can be pushed to an Edge Function or handled asynchronously
    
    try {
      const githubRes = await fetch(`https://api.github.com/repos/${repo_owner}/${repo_name}`);
      const repoData = await githubRes.json();
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
      // Dummy check to represent AI Call
      
      const analysisData = {
        tree: [{ path: "README.md", type: "blob" }],
        langs: [{ name: repoData.language || "Unknown", pct: 100, color: "#ccc" }],
        stats: { loc: 1000, files: 1, lastCommit: repoData.updated_at },
        readme: "Scan hoàn tất bằng Next.js API Routes",
        modules: [
          { name: "Core", path: "/", purpose: { vi: "Phần lõi", en: "Core module" } }
        ]
      };

      await supabase.from('scans').update({
        status: 'done',
        data: analysisData,
        finished_at: new Date().toISOString()
      }).eq('id', scanId);

    } catch (analysisErr) {
      console.error(analysisErr);
      await supabase.from('scans').update({ status: 'failed' }).eq('id', scanId);
    }

    // Return the response immediately
    return NextResponse.json({ id: scanId, status: 'queued' });

  } catch (error) {
    console.error('Scan Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
