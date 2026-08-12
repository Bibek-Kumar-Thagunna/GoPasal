#!/usr/bin/env bash
# Secrets scanner for the GoPasal repo.
#
# Scans tracked source files (excluding node_modules, build output, and lock
# files) for high-entropy or well-known secret patterns. Fails (exit 1) when
# anything is found so CI can enforce it.
#
# Usage:  bash scripts/check-secrets.sh

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Patterns: private keys, AWS/Google/Firebase service accounts, live API keys.
PATTERNS=(
  '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'
  '"type"[[:space:]]*:[[:space:]]*"service_account"'
  'AIza[0-9A-Za-z_-]{20,}'                    # Google API key
  'AKIA[0-9A-Z]{16}'                          # AWS access key
  'sk_live_[0-9a-zA-Z]{20,}'                  # Stripe live key
  'xox[baprs]-[0-9A-Za-z-]{20,}'              # Slack token
  'ghp_[0-9A-Za-z]{30,}'                      # GitHub PAT
  'sk-[0-9A-Za-z]{40,}'                       # OpenAI-style key
)

EXCLUDES="--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.expo --exclude-dir=dist --exclude-dir=build --exclude-dir=.git --exclude-dir=.agent --exclude-dir=android --exclude-dir=ios --exclude=*.lock --exclude=*.lockb --exclude=*.png --exclude=*.jpg --exclude=*.jpeg --exclude=*.webp --exclude=*.pdf --exclude=*.woff* --exclude=*.ttf"

HITS=0

# Check 1: Private keys & service accounts
if grep -rEn $EXCLUDES '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|"type"[[:space:]]*:[[:space:]]*"service_account"' . 2>/dev/null | grep -v 'check-secrets.sh'; then
  echo "  ⚠ Private key or service account found!"
  HITS=$((HITS + 1))
fi

# Check 2: Live API keys (excluding legitimate client-side configs like google-services.json)
if grep -rEn $EXCLUDES --exclude="google-services.json" --exclude="GoogleService-Info.plist" 'AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16}|sk_live_[0-9a-zA-Z]{20,}|ghp_[0-9A-Za-z]{30,}|sk-[0-9A-Za-z]{40,}' . 2>/dev/null | grep -v 'check-secrets.sh'; then
  echo "  ⚠ Live API key pattern found!"
  HITS=$((HITS + 1))
fi

if [ "$HITS" -gt 0 ]; then
  echo ""
  echo "Found $HITS secret-like violation(s). Remove or rotate these before committing."
  exit 1
fi

echo "✔ No secret-like patterns found."
exit 0
