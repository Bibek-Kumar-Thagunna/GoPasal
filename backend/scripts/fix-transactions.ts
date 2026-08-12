#!/usr/bin/env bun

/**
 * Batch fix script to add DbTransaction type to all services using db.transaction()
 * This fixes the Drizzle ORM transaction API incompatibility
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = [
    'src/modules/payment/settlement.service.ts', // Line 86 still needs fixing
    'src/modules/payment/bill-split.service.ts',
    'src/modules/adtech/ad.service.ts',
    'src/modules/group-order/bill-split.service.ts',
    'src/modules/growth/coupon.service.ts',
    'src/modules/growth/loyalty.service.ts',
    'src/modules/growth/subscription.service.ts',
    'src/modules/delivery/delivery.service.ts',
    'src/modules/enterprise/enterprise-product.service.ts',
    'src/modules/pos/pos.service.ts',
    'src/modules/gamification/gamification.service.ts',
    'src/modules/invoice/invoice.service.ts',
    'src/modules/logistics/trip.service.ts',
    'src/modules/logistics/wallet.service.ts',
    'src/modules/search/search.service.ts',
    'src/modules/support/ai-agent.service.ts',
    'src/modules/order/order.service.ts',
    'src/modules/cart/group-cart.service.ts',
    'src/modules/seller/product/product.service.ts',
    'src/modules/seller/store/store.service.ts',
];

let fixedCount = 0;
let alreadyFixedCount = 0;

for (const file of files) {
    try {
        let content = readFileSync(file, 'utf-8');
        let modified = false;

        // Check if already has DbTransaction import
        if (!content.includes('type DbTransaction')) {
            // Fix import statement
            if (content.includes('import { db } from "@/db";')) {
                content = content.replace(
                    'import { db } from "@/db";',
                    'import { db, type DbTransaction } from "@/db";'
                );
                modified = true;
            }
        } else {
            alreadyFixedCount++;
            continue;
        }

        // Fix all transaction callbacks
        const transactionPatterns = [
            /db\.transaction\(async \(tx\) =>/g,
            /db\.transaction\(async \(tx: any\) =>/g,
        ];

        for (const pattern of transactionPatterns) {
            if (pattern.test(content)) {
                content = content.replace(pattern, 'db.transaction(async (tx: DbTransaction) =>');
                modified = true;
            }
        }

        if (modified) {
            writeFileSync(file, content, 'utf-8');
            console.log(`✓ Fixed: ${file}`);
            fixedCount++;
        }
    } catch (error) {
        console.error(`✗ Error fixing ${file}:`, error.message);
    }
}

console.log(`\n✓ Fixed ${fixedCount} files`);
console.log(`✓ Already fixed: ${alreadyFixedCount} files`);
console.log(`✓ Total processed: ${files.length} files`);
