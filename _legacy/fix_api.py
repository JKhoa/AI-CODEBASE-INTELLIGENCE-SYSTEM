with open('web/app/api/scan/route.js', 'r', encoding='utf-8') as f:
    code = f.read()

prefix = "    const jwt = authHeader.replace('Bearer ', '');"
suffix = "    if (insertError) throw insertError;"

start = code.find(prefix)
end = code.find(suffix) + len(suffix)

if start != -1 and end != -1:
    new_logic = '''    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return NextResponse.json({ error: 'Xác thực thất bại' }, { status: 401 });
    }

    // CREATE AUTHENTICATED CLIENT so RLS passes
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: Bearer  } }
    });

    // Generate unique ID for scan
    const scanId = Math.random().toString(36).substring(2, 10);

    // 3. Insert Initial Queued Record into Supabase
    const { data: scanRecord, error: insertError } = await userSupabase
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

    if (insertError) throw insertError;'''
    
    code = code[:start] + new_logic + code[end:]
    code = code.replace("await supabase.from('scans').update", "await userSupabase.from('scans').update")

    with open('web/app/api/scan/route.js', 'w', encoding='utf-8') as f:
        f.write(code)
