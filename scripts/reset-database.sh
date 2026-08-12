#!/usr/bin/env bash
# Wipe the local Postgres database used by GoPasal (all tables + Drizzle state), then re-run migrations.
# Use when you need a clean slate for repeated registration / testing with new emails and phones.
#
# Usage:
#   ./scripts/reset-database.sh              # interactive confirmation
#   GOPASAL_CONFIRM_DB_RESET=1 ./scripts/reset-database.sh
#   ./scripts/reset-database.sh --seed       # also run db:seed after migrate
#
# Requires: bun, backend/.env with DATABASE_URL pointing at the DB you want to destroy.
# Postgres must have pgvector installed (CREATE EXTENSION vector in migration 0000). Example:
#   sudo apt install postgresql-16-pgvector   # match your server major version

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/backend/.env"
RUN_SEED=0

for arg in "$@"; do
  if [[ "$arg" == "--seed" ]]; then
    RUN_SEED=1
  fi
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: missing ${ENV_FILE}"
  exit 1
fi

# shellcheck disable=SC2002
raw="$(grep -E '^[[:space:]]*DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- || true)"
DATABASE_URL="$(echo "$raw" | sed -e 's/^[[:space:]]*//' -e 's/^["'\'']//' -e 's/["'\'']$//')"
if [[ -z "${DATABASE_URL}" ]]; then
  echo "error: DATABASE_URL not set in ${ENV_FILE}"
  exit 1
fi

if [[ "${GOPASAL_CONFIRM_DB_RESET:-}" != "1" ]]; then
  echo ""
  echo "This will DROP all data in the database:"
  echo "  ${DATABASE_URL%%\?*}"
  echo ""
  echo "Type RESET and press Enter to continue (or Ctrl+C to abort):"
  read -r reply
  if [[ "$reply" != "RESET" ]]; then
    echo "Aborted (expected exactly: RESET)"
    exit 1
  fi
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "error: bun is required (https://bun.sh)"
  exit 1
fi

echo ""
echo "→ Dropping schemas (public + drizzle)…"
(
  cd "${ROOT}/backend"
  export DATABASE_URL
  bun -e '
import postgres from "postgres";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is empty");
const sql = postgres(url, { max: 1 });
await sql.unsafe("DROP SCHEMA IF EXISTS drizzle CASCADE");
await sql.unsafe("DROP SCHEMA IF EXISTS public CASCADE");
await sql.unsafe("CREATE SCHEMA public");
await sql.unsafe("GRANT ALL ON SCHEMA public TO PUBLIC");
await sql.end();
'
)

echo "→ Running migrations…"
( cd "${ROOT}/backend" && bun run db:migrate )

if [[ "$RUN_SEED" == "1" ]]; then
  echo "→ Seeding…"
  ( cd "${ROOT}/backend" && bun run db:seed )
else
  echo "  (skip seed; run with --seed to load seed data)"
fi

echo ""
echo "Done. Database is empty with schema applied from drizzle/ migrations."
