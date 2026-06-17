#!/usr/bin/env bash
set -euo pipefail

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install pnpm first, then rerun this script."
  exit 1
fi

pnpm install
docker compose up -d
pnpm prisma:generate
pnpm prisma:migrate
pnpm --filter @wc-assistant/api seed

echo "Bootstrap finished."
echo "Run API: pnpm dev:api"
echo "Run admin web: pnpm dev:admin"
