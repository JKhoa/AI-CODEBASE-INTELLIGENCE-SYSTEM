const fs = require('fs');
let code = fs.readFileSync('web/src/components/pages/ScanTabs.jsx', 'utf8');

const targetStr = '<Card className={w-full lg:w-96 flex shrink-0 flex-col transition-all duration-300 }>';
const replStr = '<Card className={\w-full lg:w-96 flex shrink-0 flex-col transition-all duration-300 \\}>';

code = code.replace(targetStr, replStr);
fs.writeFileSync('web/src/components/pages/ScanTabs.jsx', code, 'utf8');
