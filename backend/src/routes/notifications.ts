import { Router } from 'express';
import { addClient, removeClient } from '../notifications';
import prisma from '../prismaClient';

const router = Router();

// SSE stream for notifications
router.get('/stream', (req, res) => {
  // optional: filter by estabelecimentoId via query
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // send a ping comment to establish connection
  res.write(': connected\n\n');

  addClient(res);

  req.on('close', () => {
    removeClient(res);
  });
});

// List notifications (optionally filter by estabelecimentoId)
router.get('/', async (req, res) => {
  try {
    const estabelecimentoId = req.query.estabelecimentoId ? Number(req.query.estabelecimentoId) : undefined;
    const where: any = {};
    if (typeof estabelecimentoId === 'number' && !Number.isNaN(estabelecimentoId)) where.estabelecimentoId = estabelecimentoId;
    const notifs = await prisma.notification.findMany({ where, orderBy: { criadoEm: 'desc' } });
    return res.json(notifs);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao listar notificações' });
  }
});

// Ack notification (mark as attended)
router.post('/:id/ack', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const garcomId = req.body.garcomId ? Number(req.body.garcomId) : undefined;
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const upd = await prisma.notification.update({ where: { id }, data: { atendido: true, atendidoEm: new Date(), atendidoPorGarcomId: garcomId } });
    return res.json({ sucesso: true, notification: upd });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao confirmar notificação' });
  }
});

export default router;
