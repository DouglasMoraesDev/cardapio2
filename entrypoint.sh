#!/usr/bin/env bash
set -euo pipefail

# If PRISMA_MIGRATE_ON_STARTUP=true or NODE_ENV=production run migrations before start
if [ "${PRISMA_MIGRATE_ON_STARTUP:-false}" = "true" ] || [ "${NODE_ENV:-}" = "production" ]; then
  echo "[entrypoint] Ensuring Prisma client and applying migrations from backend/prisma..."
  # Prefer the prisma binary installed under backend/node_modules to avoid npx fetching other versions
  if [ -f ./backend/node_modules/.bin/prisma ]; then
    echo "[entrypoint] Using prisma from backend/node_modules"
    ./backend/node_modules/.bin/prisma generate --schema=./backend/prisma/schema.prisma || { echo "prisma generate failed"; exit 1; }
    ./backend/node_modules/.bin/prisma migrate deploy --schema=./backend/prisma/schema.prisma || { echo "prisma migrate deploy failed"; exit 1; }
  else
    echo "[entrypoint] prisma binary not found in backend/node_modules, falling back to npx --prefix backend"
    npx --prefix backend prisma generate --schema=./backend/prisma/schema.prisma || { echo "prisma generate failed (npx)"; exit 1; }
    npx --prefix backend prisma migrate deploy --schema=./backend/prisma/schema.prisma || { echo "prisma migrate deploy failed (npx)"; exit 1; }
  fi
fi

exec node backend/dist/index.js
