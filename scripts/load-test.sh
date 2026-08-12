#!/usr/bin/env bash
# Lightweight load/smoke test against a running GoPasal backend.
#
# Usage:
#   API_URL=http://localhost:3000/api/v1 \
#   CONCURRENCY=20 \
#   DURATION_SECONDS=10 \
#   bash scripts/load-test.sh
#
# Exercises the public endpoints (no auth required) and reports p50/p95/failures.
set -uo pipefail

API_URL="${API_URL:-http://localhost:3000/api/v1}"
CONCURRENCY="${CONCURRENCY:-20}"
DURATION_SECONDS="${DURATION_SECONDS:-10}"

ENDPOINTS=(
  "/stores"
  "/categories"
  "/store-categories"
  "/products"
  "/search?q=milk"
  "/payment/config"
)

echo "Load test: $CONCURRENCY concurrent × $DURATION_SECONDS s against $API_URL"
echo ""

START=$(date +%s)
END=$((START + DURATION_SECONDS))

# FIFO for collecting latencies
TMPDIR=$(mktemp -d)
LAT_FILE="$TMPDIR/latencies"
: > "$LAT_FILE"

hit() {
  local url="$1"
  local t0 t1 ms code
  while [ "$(date +%s)" -lt "$END" ]; do
    t0=$(date +%s%N)
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null)
    t1=$(date +%s%N)
    ms=$(((t1 - t0) / 1000000))
    printf "%s %s\n" "$code" "$ms" >> "$LAT_FILE"
  done
}

for i in $(seq 1 "$CONCURRENCY"); do
  url="${ENDPOINTS[$((i % ${#ENDPOINTS[@]}))]}"
  hit "$API_URL$url" &
done
wait

total=0
ok=0
fail=0
: > "$TMPDIR/ms"
while read -r code ms; do
  total=$((total + 1))
  if [ "$code" = "200" ]; then ok=$((ok + 1)); else fail=$((fail + 1)); fi
  echo "$ms" >> "$TMPDIR/ms"
done < "$LAT_FILE"

sort -n "$TMPDIR/ms" > "$TMPDIR/sorted"
n=$(wc -l < "$TMPDIR/sorted")
p50=""; p95=""
if [ "$n" -gt 0 ]; then
  p50=$(sed -n "$((n * 50 / 100 + 1))p" "$TMPDIR/sorted")
  p95=$(sed -n "$((n * 95 / 100 + 1))p" "$TMPDIR/sorted")
fi

echo "Requests:   $total"
echo "OK (200):   $ok"
echo "Failures:   $fail"
echo "p50 (ms):   $p50"
echo "p95 (ms):   $p95"
echo ""
if [ "$fail" -gt 0 ]; then
  echo "✗ Load test reported failures."
  exit 1
fi
echo "✔ Load test completed without failures."
rm -rf "$TMPDIR"
