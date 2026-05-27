const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dtuuljhzydntfphgumgl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RpnbfYMdMHhrwubcC7ujjQ_4_4pLD1g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('scans').select('*').order('created_at', { ascending: false }).limit(3);
  console.log("Recent scans:", data);
}
test();
