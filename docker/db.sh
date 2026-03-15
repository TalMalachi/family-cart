#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  FamilyCart — open a psql shell inside the running Postgres container
#
#  Usage:
#    ./docker/db.sh              # interactive psql
#    ./docker/db.sh "SELECT * FROM users LIMIT 5;"   # run a query
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Load env defaults
POSTGRES_USER="${POSTGRES_USER:-familycart}"
POSTGRES_DB="${POSTGRES_DB:-familycart}"

if [ -f "$ROOT/.env" ]; then
  # shellcheck disable=SC1090
  source <(grep -E '^POSTGRES_' "$ROOT/.env" | sed 's/^/export /')
fi

if [ -z "${1:-}" ]; then
  echo "Connecting to familycart database (type \\q to exit)..."
  docker exec -it familycart-postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
else
  docker exec -i familycart-postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "$1"
fi
