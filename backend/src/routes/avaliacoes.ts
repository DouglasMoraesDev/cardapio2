import { Router } from 'express';
import prisma from '../prismaClient';
import verificarToken from '../middleware/auth';
import { broadcast } from '../notifications';

const router = Router();

// Criar avaliação (cliente)
router.post('/', async (req, res) => {
  try {
    const { estrelas, comentario, mesaId, pedidoId, estabelecimentoId: estabBody } = req.body;
    const estabelecimentoId = estabBody || (req as any).estabelecimentoId;
    if (typeof estrelas !== 'number' || estrelas < 0 || estrelas > 5) return res.status(400).json({ error: 'Estrelas inválidas' });
    const data: any = { estrelas: Number(estrelas), comentario: comentario || undefined, criadoEm: new Date() };
    if (mesaId !== undefined) data.mesaId = Number(mesaId);
    if (pedidoId !== undefined) data.pedidoId = Number(pedidoId);
    if (estabelecimentoId) data.estabelecimentoId = Number(estabelecimentoId);
      const av = await (prisma as any).avaliacao.create({ data });
      try { broadcast('avaliacao_created', av); } catch (e) { console.warn('Erro ao broadcast avaliacao', e); }
    return res.json(av);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Listar avaliações (admin) — opcionalmente filtrar por estabelecimentoId
router.get('/', verificarToken, async (req, res) => {
  try {
    const estabelecimentoId = req.query.estabelecimentoId ? Number(req.query.estabelecimentoId) : (req as any).estabelecimentoId;
    const where: any = {};
    if (estabelecimentoId) where.estabelecimentoId = estabelecimentoId;
    const avals = await (prisma as any).avaliacao.findMany({ where, orderBy: { criadoEm: 'desc' } });
    return res.json(avals);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao listar avaliações' });
  }
});

export default router;
