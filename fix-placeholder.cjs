const fs = require('fs');
const f = fs.readFileSync('src/prototypes/digital-management-platform/pages.tsx', 'utf8');
let c = f;

// Fix PlaceholderPage (1911-1912): </div></div> -> </Col></Row>
c = c.replace(
  /                <\/Card>\n                <\/div>\n            <\/div>\n        <\/div>\n    \);\n\}\n\nfunction HomePage/,
  '                </Card>\n                </Col>\n            </Row>\n        </div>\n    );\n}\n\nfunction HomePage'
);

fs.writeFileSync('src/prototypes/digital-management-platform/pages.tsx', c);
console.log('PlaceholderPage fix applied');
