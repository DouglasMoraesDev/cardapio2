FROM node:20 AS builder
WORKDIR /app

# copy package metadata for root and backend
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/

# copy everything (source)
COPY . .

# install root deps and build frontend
RUN npm ci --silent && npm run build

# install backend deps, generate prisma client and build backend
RUN cd backend && npm ci --silent && npx prisma generate --schema=./prisma/schema.prisma && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy built backend, node_modules and frontend dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend/prisma ./backend/prisma

EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
