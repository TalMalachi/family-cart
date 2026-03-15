#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  FamilyCart — tail service logs
#
#  Usage:
#    ./docker/logs.sh           # all services
#    ./docker/logs.sh api       # API only
#    ./docker/logs.sh postgres  # database only
#    ./docker/logs.sh redis     # Redis only
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SERVICE="${1:-}"

if [ -z "$SERVICE" ]; then
  docker compose logs -f --tail=50
else
  docker compose logs -f --tail=100 "$SERVICE"
fi
