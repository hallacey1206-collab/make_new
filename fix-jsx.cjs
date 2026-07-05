const fs = require('fs');
const f = fs.readFileSync('src/prototypes/digital-management-platform/pages.tsx', 'utf8');
let c = f;

// Fix 1: OverviewPage (466-467): </div></div> -> </Col></Row> before '业务联动说明'
c = c.replace(
  /                    <\/Card>\n                <\/div>\n            <\/div>\n\n            <Card title="业务联动说明">/,
  '                    </Card>\n                </Col>\n            </Row>\n\n            <Card title="业务联动说明">'
);

// Fix 2: PlanReviewPage (1560-1561): </Col></Row> -> </div></div> before ReviewDrawer with onApprove
c = c.replace(
  /                    <\/Card>\n                <\/Col>\n            <\/Row>\n\n            <ReviewDrawer\n                record=\{currentRecord\}\n                open=\{drawerOpen\}\n                onClose=\{\(\) => setDrawerOpen\(false\)\}\n                onApprove/,
  '                    </Card>\n                </div>\n            </div>\n\n            <ReviewDrawer\n                record={currentRecord}\n                open={drawerOpen}\n                onClose={() => setDrawerOpen(false)}\n                onApprove'
);

// Fix 3: PlaceholderPage (1911-1912): </div></div> -> </Col></Row> before final </div>\n    );\n}\nfunction PlaceholderPage
const placeholderFix = /                    <\/Card>\n                <\/div>\n            <\/div>\n        <\/div>\n    \);\n\n\nfunction PlaceholderPage/;
if (placeholderFix.test(c)) {
  c = c.replace(
    placeholderFix,
    '                    </Card>\n                </Col>\n            </Row>\n        </div>\n    );\n\n\nfunction PlaceholderPage'
  );
}

fs.writeFileSync('src/prototypes/digital-management-platform/pages.tsx', c);
console.log('Fixes applied');
