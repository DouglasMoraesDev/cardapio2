#!/usr/bin/env bash
set -euo pipefail

# If PRISMA_MIGRATE_ON_STARTUP=true or NODE_ENV=production run migrations before start
if [ "${PRISMA_MIGRATE_ON_STARTUP:-false}" = "true" ] || [ "${NODE_ENV:-}" = "production" ]; then
  echo "[entrypoint] Running prisma migrate deploy (prisma@5) ..."
  # use prisma v5 explicitly to match generated client/schema expectations
  npx prisma@5 migrate deploy --schema=./backend/prisma/schema.prisma
fi

exec node backend/dist/index.js
