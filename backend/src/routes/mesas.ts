import { Router } from 'express';
import prisma from '../prismaClient';
import { broadcast } from '../notifications';

const router = Router();

// Listar mesas (opcional: ?estabelecimentoId= & ?aberta=true|false)
router.get('/', async (req, res) => {
  try {
    const estabelecimentoId = req.query.estabelecimentoId ? Number(req.query.estabelecimentoId) : undefined;
    const abertaQ = req.query.aberta;
    const where: any = {};
    if (typeof estabelecimentoId === 'number' && !Number.isNaN(estabelecimentoId)) where.estabelecimentoId = estabelecimentoId;
    if (abertaQ === 'true') where.aberta = true;
    if (abertaQ === 'false') where.aberta = false;
    const mesas = await prisma.mesa.findMany({ where, include: { pedidos: { include: { itens: true } } } });
    return res.json(mesas);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao listar mesas' });
  }
});

// Fechar mesa (pedir fechamento) — por enquanto apenas marca pedidos como FECHADO e retorna total
router.post('/:id/fechar', async (req, res) => {
  const param = req.params.id;
  try {
    // opcional: validar estabelecimentoId do token
    const tokenEstab = (req as any).estabelecimentoId;
    // tentar tratar param como id numérico; se não encontrado, buscar por numero
    let mesa = null as any;
    const id = Number(param);
    if (!Number.isNaN(id)) {
      mesa = await prisma.mesa.findUnique({ where: { id } });
    }
    if (!mesa) {
      mesa = await prisma.mesa.findFirst({ where: { numero: String(param) } });
    }
    if (!mesa) return res.status(404).json({ error: 'Mesa não encontrada' });
    if (tokenEstab && tokenEstab !== mesa.estabelecimentoId) return res.status(403).json({ error: 'Permissão negada' });

    const pedidos = await prisma.pedido.findMany({ where: { mesaId: mesa.id } });
    const total = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);

    // broadcast: fechamento solicitado (antes de fechar efetivamente)
    let notifId: number | null = null;
    try {
      const notif = await prisma.notification.create({ data: {
        tipo: 'mesa_fechamento_solicitado',
        mesaId: mesa.id,
        titulo: `Fechamento solicitado — Mesa ${mesa.numero}`,
        body: `Total: R$ ${Number(total || 0).toFixed(2)}`,
        estabelecimentoId: mesa.estabelecimentoId
      } });
      notifId = notif.id;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Falha ao criar Notification (mesa_fechamento_solicitado):', err);
    }
    try { broadcast('mesa_fechamento_solicitado', { notificationId: notifId, mesaId: mesa.id, mesaNumero: mesa.numero, total, estabelecimentoId: mesa.estabelecimentoId }); } catch (err) { /* ignore */ }

    await prisma.pedido.updateMany({ where: { mesaId: mesa.id }, data: { status: 'FECHADO' } });
    const taxaPaga = !!req.body.taxaPaga;
    await prisma.mesa.update({ where: { id: mesa.id }, data: { aberta: false, taxaPaga, fechadaEm: new Date() } });
    return res.json({ sucesso: true, total, taxaPaga });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao fechar mesa' });
  }
});

export default router;

// Chamar garçom (solicitação do cliente)
router.post('/:id/chamar', async (req, res) => {
  const param = req.params.id;
  try {
    let mesa = null as any;
    const id = Number(param);
    if (!Number.isNaN(id)) {
      mesa = await prisma.mesa.findUnique({ where: { id } });
    }
    if (!mesa) {
      mesa = await prisma.mesa.findFirst({ where: { numero: String(param) } });
    }
    if (!mesa) return res.status(404).json({ error: 'Mesa não encontrada' });

    let notifId: number | null = null;
    try {
      const notif = await prisma.notification.create({ data: {
        tipo: 'garcom_chamado',
        mesaId: mesa.id,
        titulo: `Garçom chamado — Mesa ${mesa.numero}`,
        body: `Cliente chamou o garçom na mesa ${mesa.numero}`,
        estabelecimentoId: mesa.estabelecimentoId
      } });
      notifId = notif.id;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Falha ao criar Notification (garcom_chamado):', err);
    }
    try { broadcast('garcom_chamado', { notificationId: notifId, mesaId: mesa.id, mesaNumero: mesa.numero, estabelecimentoId: mesa.estabelecimentoId }); } catch (err) { /* ignore */ }

    return res.json({ sucesso: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao chamar garçom' });
  }
});
