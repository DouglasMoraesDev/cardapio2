# Especificação de API esperada (resumo)

Este arquivo descreve os endpoints que o frontend espera do backend para integração.

Base path: `/api` (servido pelo backend que também serve o build do frontend)

- POST /api/estabelecimentos
  - Finalidade: registrar estabelecimento + criar usuário admin
  - Body: { establishment: { name, document, cep, address, serviceTax, logoUrl }, admin: { username, password } }
  - Response: { sucesso: true, estabelecimento: { id, nome, ... } }

- DELETE /api/estabelecimentos/:id
  - Finalidade: remover estabelecimento e TODOS os dados relacionados

- POST /api/auth/admin
  - Finalidade: autenticar admin
  - Body: { usuario, senha }
  - Response: { sucesso: true, token, estabelecimentoId }

- POST /api/auth/garcom
  - Finalidade: autenticar garçom
  - Body: { nome, senha, estabelecimentoId }
  - Response: { sucesso: true, token, estabelecimentoId }

- GET /api/produtos?estabelecimentoId=ID
  - Finalidade: listar produtos do estabelecimento

- POST /api/produtos
  - Finalidade: criar produto
  - Body: { nome, preco, descricao, categoriaId, estabelecimentoId }

- POST /api/pedidos
  - Finalidade: criar pedido (enviar para cozinha)
  - Body: { estabelecimentoId, mesaNumero, itens: [{ produtoId, quantidade, precoUnitario }], garcomId? }

- POST /api/mesas/:id/fechar
  - Finalidade: solicitar fechamento da mesa e marcar pedidos como FECHADO

Notas:
- Todos os recursos são isolados por `estabelecimentoId` — não haverá mistura de dados entre estabelecimentos.
- O backend usa MySQL com Prisma (modelo em `backend/prisma/schema.prisma`).
- O frontend atual usa chamadas Fetch via `frontend/services/api.ts` e espera JSON com os campos descritos.
