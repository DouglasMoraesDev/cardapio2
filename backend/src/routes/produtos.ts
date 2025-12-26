import { Router } from 'express';
import prisma from '../prismaClient';
import verificarToken from '../middleware/auth';

const router = Router();

// Listar produtos de um estabelecimento (pode vir o estabelecimentoId na query ou do token)
router.get('/', async (req, res) => {
  const estabelecimentoIdQuery = req.query.estabelecimentoId ? Number(req.query.estabelecimentoId) : undefined;
  const estabelecimentoIdToken = (req as any).estabelecimentoId;
  const estabelecimentoId = estabelecimentoIdQuery || estabelecimentoIdToken;
  if (!estabelecimentoId) return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
  try {
    const produtos = await prisma.produto.findMany({ where: { estabelecimentoId } });
    return res.json(produtos);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Criar produto — exige autenticação e usa estabelecimento do token
router.post('/', verificarToken, async (req, res) => {
  const { nome, preco, descricao, categoriaId } = req.body;
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!estabelecimentoId || !nome || preco == null) return res.status(400).json({ error: 'Dados incompletos' });
  try {
    const produto = await prisma.produto.create({ data: { nome, preco: Number(preco), descricao: descricao || '', categoriaId: categoriaId || null, estabelecimentoId } });
    return res.json(produto);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

export default router;
