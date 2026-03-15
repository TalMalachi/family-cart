#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  FamilyCart — start the full stack
#
#  Usage:
#    ./docker/start.sh           # production image (built from source)
#    ./docker/start.sh --dev     # development mode (hot-reload)
#    ./docker/start.sh --build   # force rebuild before starting
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}[familycart]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

# ── Parse flags ───────────────────────────────────────────────────────────────
DEV_MODE=false
FORCE_BUILD=false

for arg in "$@"; do
  case $arg in
    --dev)   DEV_MODE=true ;;
    --build) FORCE_BUILD=true ;;
    --help)
      echo "Usage: ./docker/start.sh [--dev] [--build]"
      echo "  --dev    Hot-reload development mode"
      echo "  --build  Force image rebuild"
      exit 0
      ;;
  esac
done

# ── Prerequisites check ───────────────────────────────────────────────────────
log "Checking prerequisites..."

command -v docker   >/dev/null 2>&1 || err "Docker not found. Install from https://docker.com"
command -v docker   >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || \
  err "Docker Compose not found. Update Docker Desktop to get it."

ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# ── Environment file ──────────────────────────────────────────────────────────
if [ ! -f "$ROOT/.env" ]; then
  warn ".env not found — copying from .env.docker"
  cp "$ROOT/.env.docker" "$ROOT/.env"
  ok "Created .env from defaults. Edit it to add Twilio / R2 credentials."
fi

# ── Compose files ─────────────────────────────────────────────────────────────
COMPOSE_FILES="-f docker-compose.yml"

if $DEV_MODE; then
  COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.dev.yml"
  log "Mode: DEVELOPMENT (hot-reload enabled)"
else
  log "Mode: PRODUCTION"
fi

BUILD_FLAG=""
if $FORCE_BUILD; then
  BUILD_FLAG="--build"
  log "Forcing image rebuild..."
fi

# ── Pull latest base images ───────────────────────────────────────────────────
log "Pulling base images..."
docker compose $COMPOSE_FILES pull postgres redis adminer 2>/dev/null || true

# ── Start stack ───────────────────────────────────────────────────────────────
log "Starting FamilyCart stack..."
docker compose $COMPOSE_FILES up $BUILD_FLAG --remove-orphans -d

# ── Wait for services ─────────────────────────────────────────────────────────
log "Waiting for services to be healthy..."

wait_healthy() {
  local service=$1
  local max_wait=${2:-60}
  local elapsed=0
  while [ $elapsed -lt $max_wait ]; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "familycart-${service}" 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ]; then
      ok "$service is healthy"
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo -n "."
  done
  echo ""
  warn "$service health check timed out (may still be starting)"
}

wait_healthy "postgres" 60
wait_healthy "redis"    30
wait_healthy "api"      60

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  FamilyCart is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  API         → ${CYAN}http://localhost:3000${NC}"
echo -e "  Health      → ${CYAN}http://localhost:3000/health${NC}"
echo -e "  DB browser  → ${CYAN}http://localhost:8080${NC}"
echo -e "  PostgreSQL  → ${CYAN}localhost:5432${NC}"
echo -e "  Redis       → ${CYAN}localhost:6379${NC}"
echo ""
echo -e "  DB login (Adminer):"
echo -e "    System:   PostgreSQL"
echo -e "    Server:   postgres"
echo -e "    Username: familycart"
echo -e "    Password: familycart_dev"
echo -e "    Database: familycart"
echo ""
echo -e "  Logs:  ${YELLOW}docker compose logs -f api${NC}"
echo -e "  Stop:  ${YELLOW}./docker/stop.sh${NC}"
echo -e "  Reset: ${YELLOW}./docker/reset.sh${NC}"
echo ""
