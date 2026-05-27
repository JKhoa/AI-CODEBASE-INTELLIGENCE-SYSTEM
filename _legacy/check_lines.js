const fs = require('fs');
let code = fs.readFileSync('web/src/components/pages/ScanTabs.jsx', 'utf8');
const lines = code.split('\n');
for (let i = 150; i < 170; i++) {
    if(lines[i]) console.log(i + 1 + ': ' + lines[i]);
}
