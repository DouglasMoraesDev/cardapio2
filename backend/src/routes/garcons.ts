import { Router } from 'express';
import prisma from '../prismaClient';
import verificarToken from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = Router();

// Listar garçons (query ou token)
router.get('/', async (req, res) => {
  const estabelecimentoIdQuery = req.query.estabelecimentoId ? Number(req.query.estabelecimentoId) : undefined;
  const estabelecimentoIdToken = (req as any).estabelecimentoId;
  const estabelecimentoId = estabelecimentoIdQuery || estabelecimentoIdToken;
  if (!estabelecimentoId) return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
  try {
    const garcons = await prisma.garcom.findMany({ where: { estabelecimentoId } });
    return res.json(garcons.map(g => ({ id: g.id, nome: g.nome, ativo: g.ativo, criadoEm: g.criadoEm })));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao buscar garçons' });
  }
});

// Criar garçom
router.post('/', verificarToken, async (req, res) => {
  const { nome, senha } = req.body;
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!nome || !senha) return res.status(400).json({ error: 'nome e senha são obrigatórios' });
  try {
    const hash = await bcrypt.hash(String(senha), 10);
    const garcom = await prisma.garcom.create({ data: { nome, senhaHash: hash, estabelecimentoId, ativo: true } });
    return res.json({ id: garcom.id, nome: garcom.nome, ativo: garcom.ativo, criadoEm: garcom.criadoEm });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar garçom' });
  }
});

// Atualizar garçom
router.put('/:id', verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  const { nome, senha, ativo } = req.body;
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!id) return res.status(400).json({ error: 'id inválido' });
  try {
    const g = await prisma.garcom.findUnique({ where: { id } });
    if (!g || g.estabelecimentoId !== estabelecimentoId) return res.status(404).json({ error: 'Garçom não encontrado' });
    const data: any = {};
    if (nome !== undefined) data.nome = nome;
    if (typeof ativo === 'boolean') data.ativo = ativo;
    if (senha) data.senhaHash = await bcrypt.hash(String(senha), 10);
    const updated = await prisma.garcom.update({ where: { id }, data });
    return res.json({ id: updated.id, nome: updated.nome, ativo: updated.ativo, criadoEm: updated.criadoEm });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao atualizar garçom' });
  }
});

// Excluir garçom
router.delete('/:id', verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!id) return res.status(400).json({ error: 'id inválido' });
  try {
    const g = await prisma.garcom.findUnique({ where: { id } });
    if (!g || g.estabelecimentoId !== estabelecimentoId) return res.status(404).json({ error: 'Garçom não encontrado' });
    await prisma.garcom.delete({ where: { id } });
    return res.json({ sucesso: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao excluir garçom' });
  }
});

export default router;
