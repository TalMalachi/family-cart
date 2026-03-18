#!/usr/bin/env bash
# FamilyCart Docker entrypoint. Delegates to docker helper scripts.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

run_script() {
  local script="$1"
  shift || true

  local path="$ROOT/docker/$script"
  if [[ ! -f "$path" ]]; then
    echo "[familycart] Missing script: $path" >&2
    exit 1
  fi

  if [[ ! -x "$path" ]]; then
    chmod +x "$path"
  fi

  "$path" "$@"
}

print_help() {
  cat <<'EOF'
Usage: ./docker/main.sh <command> [args]
       ./docker/main.sh              # defaults to: all

Commands:
  up [--build]         Start stack (production compose), then show status
  dev [--build]        Start stack in dev mode, then show status
  status               Show container and health status
  logs [service]       Tail logs (all services or one service)
  db [query]           Open psql or run one SQL query
  stop [--clean]       Stop stack (use --clean to remove volumes)
  reset                Full reset: wipe data and rebuild
  all [--build]        Alias for: dev + status
  help                 Show this help
EOF
}

command="${1:-all}"
if [[ $# -gt 0 ]]; then
  shift
fi

case "$command" in
  up)
    run_script start.sh "$@"
    run_script status.sh
    ;;
  dev)
    run_script dev.sh "$@"
    run_script status.sh
    ;;
  all)
    run_script dev.sh "$@"
    run_script status.sh
    ;;
  status)
    run_script status.sh "$@"
    ;;
  logs)
    run_script logs.sh "$@"
    ;;
  db)
    run_script db.sh "$@"
    ;;
  stop)
    run_script stop.sh "$@"
    ;;
  reset)
    run_script reset.sh "$@"
    ;;
  help|-h|--help)
    print_help
    ;;
  *)
    echo "Unknown command: $command" >&2
    print_help
    exit 1
    ;;
esac

