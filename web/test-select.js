const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://dtuuljhzydntfphgumgl.supabase.co',
  'sb_publishable_RpnbfYMdMHhrwubcC7ujjQ_4_4pLD1g'
);

async function test() {
  const { data, error } = await supabase.from('scans').select('*').eq('id', '2ah05wkj').single();
  console.log("Anon select:", data, error);
}

test();
