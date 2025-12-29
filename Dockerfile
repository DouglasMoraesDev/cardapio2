FROM node:20 AS builder
WORKDIR /app

# copy package metadata for root and backend
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/

# copy everything (source)
COPY . .

# install backend deps first (ensure backend build has its node_modules), generate prisma client and build backend
RUN cd backend && NODE_ENV=development npm ci --silent && npx prisma generate --schema=./prisma/schema.prisma && npm run build

# install root deps and build frontend
RUN npm ci --silent && npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# ensure OpenSSL is available for Prisma runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
	openssl \
	ca-certificates \
	libssl-dev \
	&& rm -rf /var/lib/apt/lists/*

# copy built backend, node_modules and frontend dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend/prisma ./backend/prisma

# entrypoint script will run migrations (if enabled) and start the server
COPY entrypoint.sh /entrypoint.sh
COPY healthcheck.js /healthcheck.js
RUN chmod +x /entrypoint.sh

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD node /healthcheck.js || exit 1
ENTRYPOINT ["/entrypoint.sh"]
