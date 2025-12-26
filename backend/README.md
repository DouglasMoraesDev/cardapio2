# Backend do Cardápio (Prisma + MySQL)

Estrutura inicial do backend em TypeScript usando Express e Prisma.

Passos rápidos:

1. Copie as variáveis de ambiente do Railway para `DATABASE_URL` ou use o painel do Railway.
2. Instale dependências: `npm install` dentro da pasta `backend`.
3. Gere cliente Prisma: `npx prisma generate`.
4. Rode migração (em dev): `npx prisma migrate dev --name init`.
5. Rode em dev: `npm run dev`.

Os modelos do Prisma estão em `prisma/schema.prisma` (todos em português).
