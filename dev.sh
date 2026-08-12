#!/usr/bin/env bash
# Start backend + Expo web apps for local testing.
#
# Usage:
#   ./dev.sh
#   npm run dev:stack
#
# Optional (Linux / low inotify limits):
#   GOPASAL_DEV_CORE_ONLY=1 ./dev.sh     → backend + seller only (fewer file watchers)
#   GOPASAL_DEV_NO_ADMIN=1 ./dev.sh      → backend + customer + seller (no admin)
#
# Requirements: bun, Node/npx, Postgres (DATABASE_URL), optional Redis per backend .env.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Always compute LAN_IP dynamically to avoid stale environment variables
LAN_IP=$(ip -4 -o addr show 2>/dev/null | awk '{print $2, $4}' | grep -vE 'lo|docker|virbr|br-|veth|CloudflareWARP' | head -n 1 | awk '{print $2}' | cut -d/ -f1)

if [[ -z "$LAN_IP" ]]; then
  LAN_IP=$(ip -4 route get 8.8.8.8 2>/dev/null | awk '{print $7}' | head -n 1)
fi
if [[ -z "$LAN_IP" ]]; then
  LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="localhost"
fi

if [[ -n "${EXPO_PUBLIC_API_BASE_URL:-}" && "${EXPO_PUBLIC_API_BASE_URL}" != "http://172."* ]]; then
  # Only use existing variable if it doesn't look like a stale LAN IP
  API_URL="${EXPO_PUBLIC_API_BASE_URL}"
else
  API_URL="http://${LAN_IP}:3000/api/v1"
fi
export BROWSER="${BROWSER:-none}"

if ! command -v bun >/dev/null 2>&1; then
  echo "error: bun is required (https://bun.sh). Install bun, then retry."
  exit 1
fi
if ! command -v npx >/dev/null 2>&1; then
  echo "error: npx (Node.js) is required."
  exit 1
fi

linux_inotify_hint() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    return 0
  fi
  local proc="/proc/sys/fs/inotify/max_user_watches"
  if [[ ! -r "${proc}" ]]; then
    return 0
  fi
  local cur
  cur="$(cat "${proc}")"
  echo ""
  echo "  Linux inotify: max_user_watches = ${cur}"
  if [[ "${cur}" -lt 524288 ]]; then
    echo ""
    echo "  ⚠ Metro (Expo) uses many file watchers. With the limit above, ENOSPC is likely when"
    echo "    running several Expo apps at once."
    echo ""
    echo "  Fix (recommended, one-time, needs sudo):"
    echo "    echo fs.inotify.max_user_watches=524288 | sudo tee /etc/sysctl.d/99-gopasal-inotify.conf"
    echo "    sudo sysctl --system"
    echo ""
    echo "  Or install Watchman so Metro can use it: https://facebook.github.io/watchman/docs/install"
    echo ""
    echo "  Or start fewer frontends until you raise the limit:"
    echo "    GOPASAL_DEV_CORE_ONLY=1 ./dev.sh     # backend + seller web only"
    echo "    GOPASAL_DEV_NO_ADMIN=1 ./dev.sh      # backend + customer + seller (no admin)"
    echo ""
  fi
  if command -v watchman >/dev/null 2>&1; then
    echo "  Watchman detected on PATH — Metro should prefer it over raw inotify."
    echo ""
  fi
}

linux_inotify_hint

CORE_ONLY="${GOPASAL_DEV_CORE_ONLY:-0}"
NO_ADMIN="${GOPASAL_DEV_NO_ADMIN:-0}"

echo ""
echo "━━━━━━━━ GoPasal Unified Dev Stack ━━━━━━━━"
echo "  Backend API:     ${API_URL%/api/v1}  (REST API + Docs)"
echo "  LAN IP Address:  ${LAN_IP}"
echo ""
echo "  🌐 WEB BROWSERS:"
echo "     Customer Web: http://localhost:8081"
echo "     Seller Web:   http://localhost:8082"
echo "     Admin Web:    http://localhost:8083"
echo ""
echo "  📱 MOBILE EXPO GO — Scan QR Codes below with Expo Go or Phone Camera:"
echo ""
echo "  [Customer App: exp://${LAN_IP}:8081]"
npx -y qrcode --small "exp://${LAN_IP}:8081" 2>/dev/null || true
echo ""
echo "  [Seller App: exp://${LAN_IP}:8082]"
npx -y qrcode --small "exp://${LAN_IP}:8082" 2>/dev/null || true
echo ""
echo "  EXPO_PUBLIC_API_BASE_URL: ${API_URL}"
echo ""
echo "  Press Ctrl+C anytime to stop all services."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ "${CORE_ONLY}" == "1" ]]; then
  exec npx concurrently \
    -n backend,seller \
    -c blue,green \
    "cd \"${ROOT}/backend\" && bun run dev" \
    "cd \"${ROOT}/apps/seller\" && env REACT_NATIVE_PACKAGER_HOSTNAME=\"${LAN_IP}\" EXPO_PUBLIC_API_BASE_URL=\"${API_URL}\" npx expo start -c --lan --port 8082 --max-workers 2"
fi

if [[ "${NO_ADMIN}" == "1" ]]; then
  exec npx concurrently \
    -n backend,customer,seller \
    -c blue,magenta,green \
    "cd \"${ROOT}/backend\" && bun run dev" \
    "sleep 6 && cd \"${ROOT}/apps/customer\" && env REACT_NATIVE_PACKAGER_HOSTNAME=\"${LAN_IP}\" EXPO_PUBLIC_API_BASE_URL=\"${API_URL}\" EXPO_PUBLIC_CURRENCY_SYMBOL='Rs ' EXPO_PUBLIC_CURRENCY=Rs npx expo start -c --lan --port 8081 --max-workers 2" \
    "cd \"${ROOT}/apps/seller\" && env REACT_NATIVE_PACKAGER_HOSTNAME=\"${LAN_IP}\" EXPO_PUBLIC_API_BASE_URL=\"${API_URL}\" npx expo start -c --lan --port 8082 --max-workers 2"
fi

exec npx concurrently \
  -n backend,customer,seller,admin \
  -c blue,magenta,green,yellow \
  "cd \"${ROOT}/backend\" && bun run dev" \
  "sleep 6 && cd \"${ROOT}/apps/customer\" && env REACT_NATIVE_PACKAGER_HOSTNAME=\"${LAN_IP}\" EXPO_PUBLIC_API_BASE_URL=\"${API_URL}\" EXPO_PUBLIC_CURRENCY_SYMBOL='Rs ' EXPO_PUBLIC_CURRENCY=Rs npx expo start -c --lan --port 8081 --max-workers 2" \
  "cd \"${ROOT}/apps/seller\" && env REACT_NATIVE_PACKAGER_HOSTNAME=\"${LAN_IP}\" EXPO_PUBLIC_API_BASE_URL=\"${API_URL}\" npx expo start -c --lan --port 8082 --max-workers 2" \
  "cd \"${ROOT}/apps/admin-web\" && env NEXT_PUBLIC_API_BASE_URL=\"${API_URL}\" npm run dev"
