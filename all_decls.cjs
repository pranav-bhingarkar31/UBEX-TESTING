const fs = require('fs');
const path = require('path');

const target = path.resolve('src/App.tsx');
console.log('Target path:', target);
console.log('File exists:', fs.existsSync(target));
if (fs.existsSync(target)) {
  const stat = fs.statSync(target);
  console.log('File size:', stat.size);
  const code = fs.readFileSync(target, 'utf8');
  console.log('Code length in chars:', code.length);
  console.log('First 200 chars:', JSON.stringify(code.slice(0, 200)));
}
