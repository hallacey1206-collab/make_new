import * as fs from 'fs';
const f = fs.readFileSync('src/prototypes/digital-management-platform/pages.tsx', 'utf8');
const lines = f.split('\n');
for (let i = 1912; i <= 1925; i++) console.log((i+1)+': '+JSON.stringify(lines[i]));
