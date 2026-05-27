const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dtuuljhzydntfphgumgl.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RpnbfYMdMHhrwubcC7ujjQ_4_4pLD1g';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Login
  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  });
  
  if (authErr) {
    console.log("Auth Error:", authErr.message);
    return;
  }

  console.log("Logged in as:", user.id);

  // Insert
  const scanId = 'test-' + Date.now();
  const { data: insData, error: insErr } = await supabase.from('scans').insert({
    id: scanId, user_id: user.id, repo_owner: 'test', repo_name: 'test', status: 'queued', data: {}
  }).select();

  console.log("Insert:", insErr ? insErr.message : "Success");

  // Try Delete
  const { data: delData, error: delErr } = await supabase.from('scans').delete().eq('id', scanId).select();
  
  console.log("Delete:", delErr ? delErr.message : (delData?.length ? "Success" : "0 rows deleted"));
}

test();
