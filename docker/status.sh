#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  FamilyCart — show stack status
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  FamilyCart — stack status${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

for container in familycart-postgres familycart-redis familycart-api familycart-adminer; do
  name=$(echo "$container" | sed 's/familycart-//')
  if docker inspect "$container" >/dev/null 2>&1; then
    running=$(docker inspect --format='{{.State.Running}}' "$container")
    health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' "$container")
    if [ "$running" = "true" ]; then
      if [ "$health" = "healthy" ] || [ "$health" = "n/a" ]; then
        echo -e "  ${GREEN}●${NC} ${name} — running (${health})"
      else
        echo -e "  ${YELLOW}●${NC} ${name} — running (${health})"
      fi
    else
      echo -e "  ${RED}●${NC} ${name} — stopped"
    fi
  else
    echo -e "  ${RED}●${NC} ${name} — not found"
  fi
done

echo ""
echo -e "  API    → ${CYAN}http://localhost:3000/health${NC}"
echo -e "  DB UI  → ${CYAN}http://localhost:8999${NC}"
echo ""

# Quick API health ping
if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
  echo -e "  ${GREEN}[✓] API health check passed${NC}"
else
  echo -e "  ${RED}[✗] API not reachable on :3000${NC}"
fi
echo ""
