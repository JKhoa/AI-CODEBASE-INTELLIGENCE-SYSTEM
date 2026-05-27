const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://dtuuljhzydntfphgumgl.supabase.co',
  'sb_publishable_RpnbfYMdMHhrwubcC7ujjQ_4_4pLD1g'
);

async function test() {
  const email = `test${Date.now()}@test.com`;
  const password = 'password123';
  
  const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
  if (authErr) { console.error("Auth err:", authErr); return; }
  
  const user = authData.user;
  console.log("Logged in as:", user.id);
  
  const id = 'scan-' + Date.now().toString().slice(-8);
  const { data: iData, error: iErr } = await supabase.from('scans').insert({
    id, user_id: user.id, repo_owner: 'test', repo_name: 'test', status: 'scanning', data: {}
  }).select();
  console.log("Insert result:", iData, iErr);

  const { data: uData, error: uErr } = await supabase.from('scans').update({
    status: 'done'
  }).eq('id', id).select();
  console.log("Update result:", uData, uErr);
}
test();
