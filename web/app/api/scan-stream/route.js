import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchGithubTree, buildArchGraph, extractImports, runGeminiAnalysis, buildFileTree, fetchGithubFileContent } from '@/src/lib/analyze';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const body = await req.json();
    const { url, token, workspaceId } = body;
    
    if (!url || !url.includes('github.com')) {
      return NextResponse.json({ error: 'URL GitHub không hợp lệ' }, { status: 400 });
    }

    const parts = url.split('github.com/')[1].split('/');
    const repo_owner = parts[0];
    const repo_name = parts[1].replace('.git', '').replace(/[?#].*$/, '');

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return NextResponse.json({ error: 'Xác thực thất bại' }, { status: 401 });
    }

    const scanId = Math.random().toString(36).substring(2, 10);
    const userSupabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: 'Bearer ' + jwt } } });

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data) => {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        const t0 = Date.now();
        const log = (msg) => console.log(`[Scan ${scanId}] ${msg} (+${Date.now() - t0}ms)`);

        try {
          const ghToken = process.env.GITHUB_TOKEN || '';
          const geminiKey = process.env.GEMINI_API_KEY || '';

          // Send initial stage
          sendEvent({ stage: 'cloning' });

          // ===== PHASE 1: Fetch repo tree =====
          log('Phase 1: Fetching repo tree...');
          const { repoData, blobs } = await fetchGithubTree(repo_owner, repo_name, ghToken);
          const branch = repoData.default_branch || 'main';
          
          const langCounts = {};
          blobs.forEach(b => {
            const ext = b.path.split('.').pop().toLowerCase();
            if (ext && ext.length <= 4) langCounts[ext] = (langCounts[ext] || 0) + 1;
          });
          const totalLangs = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
          const colorMap = {
            js: '#f1e05a', ts: '#3178c6', tsx: '#3178c6', jsx: '#f1e05a', py: '#3572A5', go: '#00ADD8', rs: '#def15a',
            html: '#e34c26', css: '#563d7c', json: '#294e80', md: '#8e44ad', java: '#b07219', rb: '#701516', php: '#4F5D95',
            c: '#555555', cpp: '#f34b7d', cs: '#178600', swift: '#F05138', kt: '#A97BFF', dart: '#00B4AB',
            sh: '#89e051', yml: '#cb171e', yaml: '#cb171e', toml: '#9c4221'
          };
          const langs = Object.entries(langCounts)
            .map(([name, count]) => ({ name: name.toUpperCase(), pct: Math.round((count / totalLangs) * 100), color: colorMap[name] || '#ccc' }))
            .sort((a, b) => b.pct - a.pct).slice(0, 8);

          const basicFilesData = blobs.map(b => ({
            path: b.path, type: 'file', loc: b.size ? Math.ceil(b.size / 30) : 10, size: b.size || 0
          }));
          const tree = buildFileTree(basicFilesData);

          // Update stage to parsing
          sendEvent({
            stage: 'parsing',
            tree, langs,
            stats: { loc: 0, files: blobs.length, modules: 0, contributors: 1, lastCommit: repoData.updated_at },
            repo: { owner: repo_owner, name: repo_name, url: repoData.html_url, branch, desc: { vi: repoData.description, en: repoData.description }, stars: repoData.stargazers_count, forks: repoData.forks_count }
          });

          // AI Analysis will run after fetching code contents.

          // ===== PHASE 2: Fetch key files =====
          const keyExtensions = ['.json', '.toml', '.mod', '.txt', '.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.rb', '.php'];
          const candidateFiles = blobs
            .filter(b => keyExtensions.some(ext => b.path.endsWith(ext)))
            .filter(b => !b.path.includes('node_modules/') && !b.path.includes('vendor/') && !b.path.includes('.min.'))
            .sort((a, b) => (a.size || 0) - (b.size || 0)).slice(0, 20);

          let importsByFile = {};
          let filesData = [];
          let codeSnippets = [];
          const CONCURRENCY = 20;
          for (let i = 0; i < candidateFiles.length; i += CONCURRENCY) {
            const batch = candidateFiles.slice(i, i + CONCURRENCY);
            const results = await Promise.allSettled(
              batch.map(async (file) => {
                const ac = new AbortController();
                const timeout = setTimeout(() => ac.abort(), 8000);
                try {
                  const content = await fetchGithubFileContent(repo_owner, repo_name, file.path, branch, ghToken);
                  clearTimeout(timeout);
                  if (content !== null) {
                    const fileImports = extractImports(file.path, content);
                    if (fileImports.length > 0) importsByFile[file.path] = fileImports;
                    
                    const snippetLength = content.length > 500 ? 500 : content.length;
                    codeSnippets.push(`// File: ${file.path}\n${content.substring(0, snippetLength)}...`);
                    
                    return { path: file.path, type: 'file', loc: content.split('\n').length, size: Buffer.byteLength(content, 'utf8') };
                  }
                } catch (e) { clearTimeout(timeout); }
                return null;
              })
            );
            results.forEach(r => { if (r.status === 'fulfilled' && r.value) filesData.push(r.value); });
          }

          const processedPaths = new Set(filesData.map(f => f.path));
          blobs.forEach(b => {
            if (!processedPaths.has(b.path)) {
              filesData.push({ path: b.path, type: 'file', loc: b.size ? Math.ceil(b.size / 30) : 10, size: b.size || 0 });
            }
          });

          const arch = buildArchGraph(filesData, importsByFile);
          const totalLoc = filesData.reduce((acc, f) => acc + f.loc, 0);

          sendEvent({
            stage: 'summarizing',
            tree, arch, langs,
            stats: { loc: totalLoc, files: blobs.length, modules: 0, contributors: 1, lastCommit: repoData.updated_at }
          });

          // Start AI Analysis
          const readmeBlob = blobs.find(b => b.path.toLowerCase() === 'readme.md');
          let readmeContent = '';
          if (readmeBlob) {
            readmeContent = await fetchGithubFileContent(repo_owner, repo_name, readmeBlob.path, branch, ghToken) || '';
          }
          const combinedCodeSnippets = codeSnippets.join('\n\n');
          const aiPromise = runGeminiAnalysis(geminiKey, blobs, readmeContent, combinedCodeSnippets);

          // Wait for AI
          const aiOutput = await aiPromise;

          // Assemble Final Data
          const analysisData = {
            stage: 'ready',
            repo: { owner: repo_owner, name: repo_name, url: repoData.html_url, branch, desc: { vi: repoData.description, en: repoData.description }, stars: repoData.stargazers_count, forks: repoData.forks_count },
            tree, arch, langs,
            stats: { loc: totalLoc, files: blobs.length, modules: aiOutput.modules?.length || 0, contributors: 1, lastCommit: repoData.updated_at },
            readme: `# ${repo_name}\n\n${repoData.description || 'No description available.'}\n\n*Phân tích tự động bằng AI.*`,
            modules: aiOutput.modules || [], security: aiOutput.security || [], tours: aiOutput.tours || [], domains: aiOutput.domains || [], aiAssessment: aiOutput.aiAssessment || null
          };

          // SINGLE INSERT INTO SUPABASE AT THE END (Bypass UPDATE issue)
          const { error: insertError } = await userSupabase.from('scans').insert({
            id: scanId,
            user_id: user.id,
            workspace_id: workspaceId || null,
            repo_owner,
            repo_name,
            status: 'done',
            data: analysisData,
            finished_at: new Date().toISOString()
          });

          if (insertError) {
            console.error('Final Insert Error:', insertError);
            sendEvent({ stage: 'failed', error: insertError.message });
          } else {
            // Done! Send the new ID back to frontend
            sendEvent({ stage: 'ready', scanId });
          }
          controller.close();
        } catch (error) {
          console.error("Scan Stream Error:", error);
          sendEvent({ stage: 'failed', error: error.message });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
    });

  } catch (error) {
    console.error('Scan Init Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
