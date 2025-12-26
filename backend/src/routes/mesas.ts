import { Router } from 'express';
import prisma from '../prismaClient';

const router = Router();

// Fechar mesa (pedir fechamento) — por enquanto apenas marca pedidos como FECHADO e retorna total
router.post('/:id/fechar', async (req, res) => {
  const id = Number(req.params.id);
  try {
    // opcional: validar estabelecimentoId do token
    const tokenEstab = (req as any).estabelecimentoId;
    const mesa = await prisma.mesa.findUnique({ where: { id } });
    if (!mesa) return res.status(404).json({ error: 'Mesa não encontrada' });
    if (tokenEstab && tokenEstab !== mesa.estabelecimentoId) return res.status(403).json({ error: 'Permissão negada' });

    const pedidos = await prisma.pedido.findMany({ where: { mesaId: id } });
    const total = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
    await prisma.pedido.updateMany({ where: { mesaId: id }, data: { status: 'FECHADO' } });
    await prisma.mesa.update({ where: { id }, data: { aberta: false } });
    return res.json({ sucesso: true, total });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao fechar mesa' });
  }
});

export default router;
