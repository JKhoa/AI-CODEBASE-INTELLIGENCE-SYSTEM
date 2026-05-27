const fs = require('fs');
let code = fs.readFileSync('web/app/api/scan/route.js', 'utf8');

code = code.replace(
    "const { data: scanRecord, error: insertError } = await supabase",
    "const userSupabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: \Bearer \\ } } });\n    const { data: scanRecord, error: insertError } = await userSupabase"
);

code = code.replace(
    "await supabase.from('scans').update({",
    "await userSupabase.from('scans').update({"
);
code = code.replace(
    "await supabase.from('scans').update({ status: 'failed' }).eq('id', scanId);",
    "await userSupabase.from('scans').update({ status: 'failed' }).eq('id', scanId);"
);

fs.writeFileSync('web/app/api/scan/route.js', code, 'utf8');
