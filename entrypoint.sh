#!/usr/bin/env bash
set -euo pipefail

# If PRISMA_MIGRATE_ON_STARTUP=true or NODE_ENV=production run migrations before start
if [ "${PRISMA_MIGRATE_ON_STARTUP:-false}" = "true" ] || [ "${NODE_ENV:-}" = "production" ]; then
  echo "[entrypoint] Ensuring Prisma client and applying migrations from backend/prisma..."
  # Start a lightweight temporary health server so platform can see the container as 'up'
  # This prevents edge 502 while migrations/generation run.
  echo "[entrypoint] Starting temporary health server on PORT=${PORT:-4000}"
  node -e "const http=require('http');const p=process.env.PORT||4000;const s=http.createServer((req,res)=>{if(req.url==='/_health'){res.writeHead(200);res.end('ok')}else{res.writeHead(200);res.end('ok')}});s.listen(p,'0.0.0.0');console.log('temp-healthlistening',p);process.on('message',m=>{if(m==='stop')s.close()});" &
  TEMP_HEALTH_PID=$!
  echo "[entrypoint] temp health pid=$TEMP_HEALTH_PID"
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

# Stop temporary health server (if it was started)
if [ -n "${TEMP_HEALTH_PID:-}" ]; then
  echo "[entrypoint] Stopping temporary health server pid=${TEMP_HEALTH_PID}"
  kill ${TEMP_HEALTH_PID} || true
  unset TEMP_HEALTH_PID
fi

exec node backend/dist/index.js
