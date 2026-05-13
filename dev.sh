#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[vigil]${NC} $1"; }
warn() { echo -e "${YELLOW}[vigil]${NC} $1"; }
err()  { echo -e "${RED}[vigil]${NC} $1" >&2; }

# ── 1. Docker ────────────────────────────────────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  err "Docker is not running. Start Docker Desktop and retry."
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^vigil_postgres$"; then
  warn "Starting Docker services..."
  docker-compose -f "$ROOT/docker-compose.yml" up -d
else
  log "Docker services already running."
fi

# ── 2. Wait for Postgres ─────────────────────────────────────────────────────
warn "Waiting for Postgres to be ready..."
RETRIES=30
until docker exec vigil_postgres pg_isready -U vigil -d vigil_dev > /dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -eq 0 ]; then
    err "Postgres did not become ready in time."
    exit 1
  fi
  sleep 1
done
log "Postgres ready."

# ── 3. Migrations ────────────────────────────────────────────────────────────
warn "Running Prisma migrations..."
(cd "$ROOT/backend" && npx prisma migrate dev --skip-seed 2>&1 | grep -v "^$")
log "Migrations up to date."

# ── 4. Start backend + frontend ──────────────────────────────────────────────
log "Starting API (port 3001) and Web (port 3000)..."
log "Auth bypass: ON  |  Stop with Ctrl+C"
echo ""

exec npx concurrently \
  --names "api,web" \
  --prefix-colors "cyan,magenta" \
  --kill-others \
  "cd \"$ROOT/backend\"  && DEV_AUTH_BYPASS=true npm run start:dev" \
  "cd \"$ROOT/frontend\" && NEXT_PUBLIC_DEV_AUTH_BYPASS=true npm run dev"
