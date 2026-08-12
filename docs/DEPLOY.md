# GoPasal VPS deployment

Self-hosted checklist for API, admin panel, and customer web on one VPS.

## 1. Prerequisites

- Ubuntu 22.04+ (or similar)
- Docker & Docker Compose
- Domain with DNS: `api.`, `admin.`, `shop.` subdomains → VPS IP
- Optional: [Sparrow SMS](https://sparrowsms.com), [Resend](https://resend.com), Khalti / eSewa merchant keys

## 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Set at minimum:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres (compose sets this automatically) |
| `JWT_SECRET` | Session signing (32+ random chars) |
| `PUBLIC_WEB_URL` | `https://shop.yourdomain.com` — Khalti/eSewa return |
| `PUBLIC_API_URL` | `https://api.yourdomain.com` — eSewa launch redirect |
| `ALLOWED_ORIGINS` | Comma-separated front-end origins |
| `KHALTI_SECRET_KEY` | Live/sandbox Khalti |
| `ESEWA_*` | Live eSewa or `ESEWA_MOCK_ENABLED=true` for testing |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth Web client |
| `SPARROW_SMS_TOKEN` | OTP SMS (logs to console if unset in dev) |
| `RESEND_API_KEY` | Order update emails |

Admin web (`apps/admin-web/.env.local`):

```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same as GOOGLE_CLIENT_ID>
```

## 3. Start stack

```bash
docker compose up -d --build
docker compose exec api bun run db:migrate
docker compose exec api bun run db:seed   # optional demo data
```

Services:

- API: port `3000`
- Admin: port `8083`
- Postgres: port `5432`

## 4. TLS & nginx

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/gopasal
# Edit YOUR_DOMAIN, then:
sudo ln -s /etc/nginx/sites-available/gopasal /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.yourdomain.com -d admin.yourdomain.com -d shop.yourdomain.com
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Customer web (static)

```bash
cd apps/customer
# Set EXPO_PUBLIC_API_URL in .env if used
npm run build:web
sudo mkdir -p /var/www/gopasal-customer
sudo cp -r dist/* /var/www/gopasal-customer/
```

## 6. Google admin login

1. Create OAuth 2.0 **Web** client in Google Cloud Console.
2. Authorized JavaScript origins: `https://admin.yourdomain.com`
3. Copy Client ID to `GOOGLE_CLIENT_ID` (API) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (admin).
4. Admin user must already exist with matching **email** and role `SUPER_ADMIN` or `PLATFORM_OPERATOR`.

## 7. Repair stores approved before KYC sync (if needed)

If sellers stay on “Under review” after admin approval on an older build:

```bash
psql "$DATABASE_URL" -f backend/scripts/fix-approved-store-kyc.sql
```

New approvals sync `status`, `verificationStep`, and `kycStatus` automatically.

## 8. Smoke test

1. Seller app: set shop pin + delivery radius.
2. Customer: **Use Current Location** on location screen.
3. Place COD order → seller marks delivered with **COD collected**.
4. Place Khalti order (min Rs. 10) → pay → return URL verifies.
5. eSewa: mock or live credentials → pay → `/payment/return?data=...` verifies.

## 9. Logs

```bash
docker compose logs -f api
docker compose logs -f admin-web
```
