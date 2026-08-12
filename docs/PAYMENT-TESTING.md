# GoPasal payment testing guide

Use this checklist to verify product checkout, memberships, shop tiers, COD, refunds, and SkyPay.

## 1. Environment setup

```bash
# backend/.env
SKYPAY_ENABLED=true
SKYPAY_MOCK_ENABLED=true          # dev without real credentials
SKYPAY_API_KEY=your_key
SKYPAY_API_SECRET=your_secret
SKYPAY_MERCHANT_ID=your_merchant
SKYPAY_BASE_URL=https://api.skypay.example   # replace with real SkyPay URL
SKYPAY_WEBHOOK_SECRET=whsec_...

PUBLIC_WEB_URL=http://localhost:8081
PUBLIC_API_URL=http://localhost:3000
PAYMENT_RETURN_PATH=/payment/return

# Optional direct fallback when SkyPay off
KHALTI_SECRET_KEY=
ESEWA_MERCHANT_ID=
ESEWA_SECRET_KEY=
ESEWA_MOCK_ENABLED=true
```

## 2. Database migrations

```bash
cd backend
psql $DATABASE_URL -f drizzle/0014_payment_architecture.sql
psql $DATABASE_URL -f drizzle/0015_billing_intents.sql
```

## 3. Start services

```bash
cd backend && bun run dev
cd apps/customer && npx expo start
cd apps/seller && npx expo start
cd apps/admin-web && npm run dev
```

## 4. Test matrix

| Flow | Steps | Expected |
|------|--------|----------|
| **Product COD** | Checkout → COD → place order | Order `PLACED`, no PSP redirect |
| **Product online** | Checkout → Khalti/eSewa → bottom sheet pay → return | `payment_status` paid, escrow HELD |
| **Order retry** | Unpaid order → “Complete payment” | Orchestrator init → verify |
| **GoPasal Gold** | Membership → plan → pay | `billing_intents` PAID, subscription ACTIVE |
| **Shop tier** | Seller → Settings → Shop tier → pay → Confirm | Store marketing subscription ACTIVE |
| **COD delivery** | Rider/seller deliver with `codCollected: true` | `cod_records` row, escrow release |
| **Admin refund** | Payments desk → refund by order id | Ledger refund, escrow reversed if HELD |
| **Webhook** | `POST /api/v1/payment/webhooks/skypay` with signed body | `webhook_events` PROCESSED |
| **Admin monitor** | Payments page → webhooks + COD tables | Recent events visible |

## 5. API quick test (curl)

```bash
# Payment config
curl -s http://localhost:3000/api/v1/payment/config | jq

# After login — checkout init
curl -s -X POST http://localhost:3000/api/v1/payment/checkout/init \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID","channel":"KHALTI"}' | jq

# Verify after return
curl -s -X POST http://localhost:3000/api/v1/payment/checkout/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID","callback":{"pidx":"MOCK_PIDX"}}' | jq
```

## 6. SkyPay production

1. Set `SKYPAY_MOCK_ENABLED=false` and real API credentials.
2. Point `SKYPAY_BASE_URL` to SkyPay assisted-mode API.
3. Register webhook: `https://your-api.com/api/v1/payment/webhooks/skypay`
4. Confirm return URL domain matches `PUBLIC_WEB_URL`.

## 7. Known limitations

- PSP refunds (money back to wallet) are ledger-only until gateway refund APIs are wired.
- Seller tier return deep-link uses in-app “Confirm payment” after wallet pay.
- Fonepay QR routes through SkyPay when `SKYPAY_ENABLED=true`.
