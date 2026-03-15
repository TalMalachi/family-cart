#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  FamilyCart — stop the stack (keeps data volumes intact)
#
#  Usage:
#    ./docker/stop.sh          # stop containers, keep volumes
#    ./docker/stop.sh --clean  # stop + remove volumes (full wipe)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CLEAN=false
for arg in "$@"; do
  [ "$arg" = "--clean" ] && CLEAN=true
done

echo -e "${CYAN}[familycart]${NC} Stopping stack..."

if $CLEAN; then
  echo -e "${YELLOW}[!]${NC} Removing volumes — all database data will be deleted"
  docker compose down -v --remove-orphans
else
  docker compose down --remove-orphans
fi

echo -e "${GREEN}[✓]${NC} Stack stopped"
$CLEAN && echo -e "${GREEN}[✓]${NC} Volumes removed"
