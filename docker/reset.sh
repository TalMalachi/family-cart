#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  FamilyCart — full reset
#  Stops everything, wipes all data, rebuilds images, starts fresh
#
#  Usage:
#    ./docker/reset.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}[!]${NC} This will DELETE all data (database + Redis) and rebuild images."
read -r -p "    Are you sure? (y/N) " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo -e "${CYAN}[familycart]${NC} Stopping and removing all containers + volumes..."
docker compose down -v --remove-orphans 2>/dev/null || true

echo -e "${CYAN}[familycart]${NC} Removing built images..."
docker rmi familycart-api 2>/dev/null || true
docker rmi "$(basename "$ROOT")-api" 2>/dev/null || true

echo -e "${CYAN}[familycart]${NC} Starting fresh..."
"$ROOT/docker/start.sh" --build

echo -e "${GREEN}[✓]${NC} Full reset complete"
