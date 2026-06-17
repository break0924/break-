#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NPM_BIN="${NPM_BIN:-npm}"

if [ -x "$ROOT_DIR/.tools/bin/npm" ]; then
  NPM_BIN="$ROOT_DIR/.tools/bin/npm"
fi

cd "$ROOT_DIR"

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/backend/.env"
  echo "Created backend/.env from .env.example"
fi

docker compose up -d postgres redis

cd "$ROOT_DIR/backend"

"$NPM_BIN" install
"$NPM_BIN" run prisma:generate
"$NPM_BIN" exec prisma migrate deploy
"$NPM_BIN" run seed

echo "Database is ready."
echo "Next: cd backend && $NPM_BIN run start:dev"
