import * as fs from 'fs';
const f = fs.readFileSync('src/prototypes/digital-management-platform/pages.tsx', 'utf8');
const lines = f.split('\n');
const stack: {tag: string, line: number}[] = [];
const tagRe = /<(\/?)([A-Z][a-zA-Z0-9]*|[a-z]+)(?=[\s/>])/;
let inJS = false, inString = false, stringChar = '';
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let col = 0;
  while (col < line.length) {
    const ch = line[col];
    if (inString) {
      if (ch === '\\') { col += 2; continue; }
      if (ch === stringChar) { inString = false; }
      col++; continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true; stringChar = ch; col++; continue;
    }
    if (!inJS && ch === '{') { inJS = true; col++; continue; }
    if (inJS && ch === '}') { inJS = false; col++; continue; }
    if (!inJS && ch === '<') {
      const rest = line.slice(col);
      const m = rest.match(tagRe);
      if (m) {
        const tag = m[2];
        const selfClose = rest.match(/^<[^>]+\/>/);
        if (!selfClose) {
          if (m[1]) {
            if (stack.length && stack[stack.length-1].tag === tag) {
              stack.pop();
            } else {
              console.log('MISMATCH at line '+(i+1)+': </'+tag+'> expected </'+ (stack[stack.length-1]?.tag||'?')+'>');
              process.exit(1);
            }
          } else {
            stack.push({tag, line: i+1});
          }
        }
        col += m[0].length;
        continue;
      }
    }
    col++;
  }
}
if (stack.length) {
  console.log('UNCLOSED tags:');
  stack.forEach(s => console.log('  <'+s.tag+'> at line '+s.line));
} else {
  console.log('All tags matched');
}
