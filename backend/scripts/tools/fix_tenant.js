const fs = require('fs');
const files = [
  'src/modules/seller/stats/stats.controller.ts',
  'src/modules/seller/insights/seller-customers.controller.ts',
  'src/modules/seller/insights/seller-earnings.controller.ts',
  'src/modules/pos/pos.controller.ts',
  'src/modules/seller/announcement/seller-announcement.controller.ts',
  'src/modules/seller/media/seller-media.controller.ts',
  'src/modules/seller/order/order.controller.ts',
  'src/modules/seller/product/product.controller.ts',
  'src/modules/seller/payments/seller-payments.controller.ts',
  'src/modules/seller/staff/staff.controller.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('.use(requireTenant())') && !content.includes('.group(')) {
    // We want to replace the `.use(requireAuth())` or `.use(requireTenant())` sequence with `.group`
    // Find where the Elysia instance ends: `prefix: "..." })`
    const regex = /(new Elysia\(\{[^}]+\}\))(\s*\.use\([\s\S]+?;)/;
    const match = content.match(regex);
    if (match) {
        const replacement = `${match[1]}\n    .group("", (app) =>\n        app${match[2].replace(/\n/g, '\n    ')}\n    );`;
        content = content.replace(regex, replacement);
        // clean up the trailing semi-colon on the inner chain since it should be on the group closure
        content = content.replace(/;\n    \);\n    \);$/, '\n    );\n');
        content = content.replace(/;\n    \);$/, '\n    );');
        fs.writeFileSync(file, content);
        console.log(`Patched ${file}`);
    }
  }
}
