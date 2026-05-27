const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://dtuuljhzydntfphgumgl.supabase.co',
  'sb_publishable_RpnbfYMdMHhrwubcC7ujjQ_4_4pLD1g'
);

async function test() {
  const id = 'test-' + Date.now().toString().slice(-8);
  console.log("Inserting:", id);
  const { data: iData, error: iErr } = await supabase.from('scans').insert({
    id, repo_owner: 'test', repo_name: 'test', status: 'scanning', data: {}
  }).select();
  console.log("Insert result:", iData, iErr);

  const { data: uData, error: uErr } = await supabase.from('scans').update({
    status: 'done'
  }).eq('id', id).select();
  console.log("Update result:", uData, uErr);
}

test();
