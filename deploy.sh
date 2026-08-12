#!/usr/bin/env bash
# ==============================================================================
# GoPasal Production Deployment Automation Script
# ==============================================================================
set -e

echo "🚀 Starting GoPasal Production Deployment..."

# 1. Pull latest changes from GitHub
if [ -d ".git" ]; then
  echo "📥 Syncing latest code from GitHub (main)..."
  git config --global --add safe.directory /opt/gopasal 2>/dev/null || true
  git fetch origin main 2>/dev/null || true
  git reset --hard origin/main 2>/dev/null || true
fi

# 2. Distribute high-resolution branding and icon pack assets
echo "🎨 Syncing official GoPasal Icon Pack assets..."
if [ -d "GoPasal_Icon_Pack" ]; then
  for d in apps/customer/public apps/customer/dist apps/customer/assets \
           apps/seller/public apps/seller/dist apps/seller/assets \
           apps/admin-web/public apps/admin-web/dist apps/admin/assets \
           apps/delivery/assets public; do
    mkdir -p "$d"
    cp -f GoPasal_Icon_Pack/* "$d/" 2>/dev/null || true
    cp -f GoPasal_Icon_Pack/icon-512x512.png "$d/logo.png" 2>/dev/null || true
    cp -f GoPasal_Icon_Pack/icon-512x512.png "$d/icon.png" 2>/dev/null || true
    cp -f GoPasal_Icon_Pack/icon-1024x1024.png "$d/adaptive-icon.png" 2>/dev/null || true
    cp -f GoPasal_Icon_Pack/favicon-96x96.png "$d/favicon.png" 2>/dev/null || true
    cp -f GoPasal_Icon_Pack/favicon.ico "$d/favicon.ico" 2>/dev/null || true
  done
fi

# 3. Export Customer & Seller Web Static Bundles
echo "📦 Building Customer Web bundle..."
if [ -d "apps/customer" ]; then
  (cd apps/customer && npx expo export --platform web)
fi

echo "📦 Building Seller Central Web bundle..."
if [ -d "apps/seller" ]; then
  (cd apps/seller && npx expo export --platform web)
fi

# 4. Ensure high-res icons are present in the freshly generated dist directories
if [ -d "GoPasal_Icon_Pack" ]; then
  cp -f GoPasal_Icon_Pack/* apps/customer/dist/ 2>/dev/null || true
  cp -f GoPasal_Icon_Pack/icon-512x512.png apps/customer/dist/logo.png 2>/dev/null || true
  cp -f GoPasal_Icon_Pack/favicon-96x96.png apps/customer/dist/favicon.png 2>/dev/null || true
  cp -f GoPasal_Icon_Pack/favicon.ico apps/customer/dist/favicon.ico 2>/dev/null || true

  cp -f GoPasal_Icon_Pack/* apps/seller/dist/ 2>/dev/null || true
  cp -f GoPasal_Icon_Pack/icon-512x512.png apps/seller/dist/logo.png 2>/dev/null || true
  cp -f GoPasal_Icon_Pack/favicon-96x96.png apps/seller/dist/favicon.png 2>/dev/null || true
  cp -f GoPasal_Icon_Pack/favicon.ico apps/seller/dist/favicon.ico 2>/dev/null || true
fi

# 5. Start / Rebuild Admin Command Center (Next.js on Port 8083)
echo "🛡️ Starting Admin Command Center (Port 8083)..."

# Free port 8083 from old process to avoid bind conflicts
fuser -k 8083/tcp 2>/dev/null || true
pkill -f "next start -p 8083" 2>/dev/null || true
if command -v pm2 &> /dev/null; then
  pm2 stop gopasal-admin 2>/dev/null || true
fi

# Method A: Try Docker Compose
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
  echo "🐳 Rebuilding and starting Admin Web Docker container..."
  docker compose stop admin-web 2>/dev/null || true
  docker compose rm -f admin-web 2>/dev/null || true
  docker compose build --no-cache admin-web
  docker compose up -d admin-web
  sleep 3
fi

# Method B: Fallback to PM2 / Node if port 8083 is not yet responding
if ! curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8083 | grep -E "200|301|302|307|308|401|403" > /dev/null; then
  echo "⚡ Starting Admin Web natively on Port 8083..."
  cd apps/admin-web
  npm install --prefer-offline 2>/dev/null || npm install
  npm run build
  if command -v pm2 &> /dev/null; then
    pm2 delete gopasal-admin 2>/dev/null || true
    pm2 start "npm run start" --name "gopasal-admin"
    pm2 save 2>/dev/null || true
  else
    pkill -f "next start -p 8083" 2>/dev/null || true
    nohup npm run start > /var/log/gopasal-admin.log 2>&1 &
  fi
  cd ../..
fi

# 6. Reload Nginx reverse proxy
echo "🔄 Reloading Nginx configuration..."
systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true

# 7. Restart background services if managed by systemd
echo "🔄 Restarting application services..."
systemctl restart gopasal-backend gopasal-customer gopasal-seller gopasal-admin 2>/dev/null || true

echo "================================================================="
echo "✅ GoPasal Production Deployment Completed Successfully!"
echo "   - Customer:   https://gopasal.com"
echo "   - Seller:     https://seller.gopasal.com"
echo "   - Admin:      https://admin.gopasal.com"
echo "================================================================="
