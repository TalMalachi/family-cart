#!/usr/bin/env bash
# Starts FamilyCart in Docker development mode (hot reload for API).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: ./docker/dev.sh [--build]"
  echo "  --build   Force image rebuild before starting"
  exit 0
fi

exec ./docker/start.sh --dev "$@"

