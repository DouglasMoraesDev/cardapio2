import { Router } from 'express';
import prisma from '../prismaClient';
import verificarToken from '../middleware/auth';

const router = Router();

// Listar categorias (query ou token)
router.get('/', async (req, res) => {
  const estabelecimentoIdQuery = req.query.estabelecimentoId ? Number(req.query.estabelecimentoId) : undefined;
  const estabelecimentoIdToken = (req as any).estabelecimentoId;
  const estabelecimentoId = estabelecimentoIdQuery || estabelecimentoIdToken;
  if (!estabelecimentoId) return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
  try {
    const categorias = await prisma.categoria.findMany({ where: { estabelecimentoId } });
    return res.json(categorias);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Criar categoria
router.post('/', verificarToken, async (req, res) => {
  const { nome } = req.body;
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });
  try {
    const categoria = await prisma.categoria.create({ data: { nome, estabelecimentoId } });
    return res.json(categoria);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Editar categoria
router.put('/:id', verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  const { nome } = req.body;
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!id || !nome) return res.status(400).json({ error: 'Dados inválidos' });
  try {
    const cat = await prisma.categoria.findUnique({ where: { id } });
    if (!cat || cat.estabelecimentoId !== estabelecimentoId) return res.status(404).json({ error: 'Categoria não encontrada' });
    const updated = await prisma.categoria.update({ where: { id }, data: { nome } });
    return res.json(updated);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Excluir categoria
router.delete('/:id', verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!id) return res.status(400).json({ error: 'id inválido' });
  try {
    const cat = await prisma.categoria.findUnique({ where: { id } });
    if (!cat || cat.estabelecimentoId !== estabelecimentoId) return res.status(404).json({ error: 'Categoria não encontrada' });
    await prisma.categoria.delete({ where: { id } });
    return res.json({ sucesso: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
});

export default router;
