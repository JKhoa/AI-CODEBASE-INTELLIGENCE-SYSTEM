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
    const { data: scanRecord, error: insertError } = await userSupabase
      .from('scans')
      .insert({
        id: scanId,
        user_id: user.id,
        workspace_id: workspaceId || null,
        repo_owner,
        repo_name,
        status: 'scanning',
        data: { 
          stage: 'cloning',
          repo: { owner: repo_owner, name: repo_name, url, branch: 'main', desc: { vi: '', en: '' }, stars: 0, forks: 0 },
          tree: [], langs: [], stats: { files: 0, loc: 0, modules: 0, contributors: 0 },
          arch: { nodes: [], edges: [] }, modules: [], security: [], tours: [], domains: [],
          readme: ''
        }
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const updateScan = async (patch) => {
      try {
        const { data, error } = await userSupabase.from('scans').update(patch).eq('id', scanId).select();
        console.log(`Supabase progressive update for ${scanId}:`, data?.length ? `Success (${data.length} rows)` : '0 rows updated', error);
      } catch (e) {
        console.error('Update scan exception:', e);
      }
    };

    // Background worker with progressive updates
    (async () => {
      const t0 = Date.now();
      const log = (msg) => console.log(`[Scan ${scanId}] ${msg} (+${Date.now() - t0}ms)`);

      try {
        const ghToken = process.env.GITHUB_TOKEN || '';
        const geminiKey = process.env.GEMINI_API_KEY || '';

        // ===== PHASE 1: Fetch repo tree (fast — 1 API call) =====
        log('Phase 1: Fetching repo tree...');
        const { repoData, blobs } = await fetchGithubTree(repo_owner, repo_name, ghToken);
        const branch = repoData.default_branch || 'main';
        log(`Phase 1 done: ${blobs.length} files found`);

        // Immediately compute languages + tree from blobs (no extra API calls)
        const langCounts = {};
        blobs.forEach(b => {
          const ext = b.path.split('.').pop().toLowerCase();
          if (ext && ext.length <= 4) {
            langCounts[ext] = (langCounts[ext] || 0) + 1;
          }
        });
        const totalLangs = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
        const colorMap = {
          js: '#f1e05a', ts: '#3178c6', tsx: '#3178c6', jsx: '#f1e05a',
          py: '#3572A5', go: '#00ADD8', rs: '#def15a', html: '#e34c26',
          css: '#563d7c', json: '#294e80', md: '#8e44ad', java: '#b07219',
          rb: '#701516', php: '#4F5D95', c: '#555555', cpp: '#f34b7d',
          cs: '#178600', swift: '#F05138', kt: '#A97BFF', dart: '#00B4AB',
          sh: '#89e051', yml: '#cb171e', yaml: '#cb171e', toml: '#9c4221'
        };
        const langs = Object.entries(langCounts)
          .map(([name, count]) => ({
            name: name.toUpperCase(),
            pct: Math.round((count / totalLangs) * 100),
            color: colorMap[name] || '#ccc'
          }))
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 8);

        // Build basic file tree (from blobs — no extra API calls)
        const basicFilesData = blobs.map(b => ({
          path: b.path,
          type: 'file',
          loc: b.size ? Math.ceil(b.size / 30) : 10, // estimate LOC from size
          size: b.size || 0
        }));
        const tree = buildFileTree(basicFilesData);

        // === PROGRESSIVE UPDATE 1: Tree + Langs ready (usually < 3s) ===
        await updateScan({
          data: {
            stage: 'parsing',
            repo: {
              owner: repo_owner, name: repo_name, url: repoData.html_url,
              branch, desc: { vi: repoData.description, en: repoData.description },
              stars: repoData.stargazers_count, forks: repoData.forks_count
            },
            tree, langs,
            stats: { loc: 0, files: blobs.length, modules: 0, contributors: 1, lastCommit: repoData.updated_at },
            arch: { nodes: [], edges: [] }, modules: [], security: [], tours: [], domains: [],
            readme: `# ${repo_name}\n\n${repoData.description || 'No description available.'}\n\n*Đang phân tích...*`
          }
        });
        log('Progressive update 1: tree + langs pushed');

        // ===== PHASE 2 & 3 PARALLEL EXECUTION =====
        // Start AI Analysis immediately (takes a few seconds)
        log('Phase 3 (Parallel): Starting AI analysis...');
        const aiPromise = runGeminiAnalysis(geminiKey, blobs);

        // ===== PHASE 2: Fetch key files for imports (concurrent, limited) =====
        log('Phase 2: Fetching file contents...');
        const keyExtensions = ['.json', '.toml', '.mod', '.txt', '.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.rb', '.php'];
        const candidateFiles = blobs
          .filter(b => keyExtensions.some(ext => b.path.endsWith(ext)))
          .filter(b => !b.path.includes('node_modules/') && !b.path.includes('vendor/') && !b.path.includes('.min.'))
          .sort((a, b) => (a.size || 0) - (b.size || 0)) // Smaller files first (faster to fetch)
          .slice(0, 20); // Reduced from 30 → 20 for speed

        let importsByFile = {};
        let filesData = [];

        // Concurrent fetch with limit of 20 at a time (all at once)
        const CONCURRENCY = 20;
        for (let i = 0; i < candidateFiles.length; i += CONCURRENCY) {
          const batch = candidateFiles.slice(i, i + CONCURRENCY);
          const results = await Promise.allSettled(
            batch.map(async (file) => {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout per file
              try {
                const content = await fetchGithubFileContent(repo_owner, repo_name, file.path, branch, ghToken);
                clearTimeout(timeout);
                if (content !== null) {
                  const loc = content.split('\n').length;
                  const size = Buffer.byteLength(content, 'utf8');
                  const fileImports = extractImports(file.path, content);
                  if (fileImports.length > 0) {
                    importsByFile[file.path] = fileImports;
                  }
                  return { path: file.path, type: 'file', loc, size };
                }
              } catch (e) {
                clearTimeout(timeout);
                // Skip failed files
              }
              return null;
            })
          );
          results.forEach(r => {
            if (r.status === 'fulfilled' && r.value) filesData.push(r.value);
          });
        }
        log(`Phase 2 done: ${filesData.length} files fetched, ${Object.keys(importsByFile).length} with imports`);

        // Merge with remaining files (use blob metadata)
        const processedPaths = new Set(filesData.map(f => f.path));
        blobs.forEach(b => {
          if (!processedPaths.has(b.path)) {
            filesData.push({
              path: b.path,
              type: 'file',
              loc: b.size ? Math.ceil(b.size / 30) : 10,
              size: b.size || 0
            });
          }
        });

        // Build architecture graph
        const arch = buildArchGraph(filesData, importsByFile);
        const totalLoc = filesData.reduce((acc, f) => acc + f.loc, 0);

        // === PROGRESSIVE UPDATE 2: Arch graph ready ===
        await updateScan({
          data: {
            stage: 'summarizing',
            repo: {
              owner: repo_owner, name: repo_name, url: repoData.html_url,
              branch, desc: { vi: repoData.description, en: repoData.description },
              stars: repoData.stargazers_count, forks: repoData.forks_count
            },
            tree, arch, langs,
            stats: { loc: totalLoc, files: blobs.length, modules: 0, contributors: 1, lastCommit: repoData.updated_at },
            modules: [], security: [], tours: [], domains: [],
            readme: `# ${repo_name}\n\n${repoData.description || 'No description available.'}\n\n*Đang chạy AI phân tích...*`
          }
        });
        log('Progressive update 2: arch graph pushed');

        // ===== WAIT FOR PHASE 3: AI Analysis =====
        log('Waiting for AI analysis to complete...');
        const aiOutput = await aiPromise;
        log('Phase 3 done: AI analysis complete');

        // === FINAL UPDATE: Everything ready ===
        const analysisData = {
          stage: 'ready',
          repo: {
            owner: repo_owner, name: repo_name, url: repoData.html_url,
            branch, desc: { vi: repoData.description, en: repoData.description },
            stars: repoData.stargazers_count, forks: repoData.forks_count
          },
          tree, arch, langs,
          stats: {
            loc: totalLoc,
            files: blobs.length,
            modules: aiOutput.modules?.length || 0,
            contributors: 1,
            lastCommit: repoData.updated_at
          },
          readme: `# ${repo_name}\n\n${repoData.description || 'No description available.'}\n\n*Phân tích tự động bằng AI Codebase Intelligence.*`,
          modules: aiOutput.modules || [],
          security: aiOutput.security || [],
          tours: aiOutput.tours || [],
          domains: aiOutput.domains || [],
          aiAssessment: aiOutput.aiAssessment || null
        };

        const { data: fData, error: finalUpdateError } = await userSupabase.from('scans').update({
          status: 'done',
          data: analysisData,
          finished_at: new Date().toISOString()
        }).eq('id', scanId).select();

        console.log(`Final update for ${scanId}:`, fData?.length ? `Success (${fData.length} rows)` : '0 rows updated', finalUpdateError);

        log(`COMPLETE — total ${Date.now() - t0}ms`);

      } catch (analysisErr) {
        console.error("Analysis Worker Error:", analysisErr);
        await userSupabase.from('scans').update({ status: 'failed' }).eq('id', scanId);
      }
    })();

    return NextResponse.json({ id: scanId, status: 'queued' });

  } catch (error) {
    console.error('Scan Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
