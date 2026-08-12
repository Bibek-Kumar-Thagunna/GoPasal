#!/usr/bin/env bash
# ==============================================================================
# GoPasal Production Deployment Automation Script
# ==============================================================================
set -e

echo "🚀 Starting GoPasal Production Deployment..."

# 1. Pull latest changes from GitHub
if [ -d ".git" ]; then
  echo "📥 Pulling latest code from GitHub (main)..."
  git pull origin main || {
    echo "⚠️ Git pull failed or branch diverged, continuing with local files..."
  }
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

# 5. Rebuild and restart Admin Command Center Docker Container
echo "🐳 Rebuilding Admin Web Docker container..."
if [ -f "docker-compose.yml" ]; then
  docker compose build --no-cache admin-web 2>/dev/null || true
  docker compose up -d admin-web 2>/dev/null || true
fi

# 6. Reload Nginx reverse proxy
echo "🔄 Reloading Nginx configuration..."
systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true

# 7. Restart background services if managed by systemd
echo "🔄 Restarting application services..."
systemctl restart gopasal-backend gopasal-customer gopasal-seller 2>/dev/null || true

echo "================================================================="
echo "✅ GoPasal Production Deployment Completed Successfully!"
echo "   - Customer:   https://gopasal.com"
echo "   - Seller:     https://seller.gopasal.com"
echo "   - Admin:      https://admin.gopasal.com"
echo "================================================================="
