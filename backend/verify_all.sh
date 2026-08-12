#!/bin/bash
set -e

echo "=== Running Seller Test ==="
bun src/scripts/test-seller.ts

echo "=== Running Delivery Test ==="
bun src/scripts/test-delivery.ts

echo "=== Running Admin Test ==="
bun src/scripts/test-admin.ts

echo "=== ALL TESTS PASSED ==="
