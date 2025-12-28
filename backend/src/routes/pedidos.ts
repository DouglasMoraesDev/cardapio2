import { Router } from 'express';
import prisma from '../prismaClient';
import { broadcast } from '../notifications';

const router = Router();

// Criar pedido para uma mesa (cria mesa se necessário)
router.post('/', async (req, res) => {
  try {
    const { estabelecimentoId: estabelecimentoIdBody, mesaNumero, itens, garcomId } = req.body;
    // tentar obter estabelecimentoId do token (se presente) ou do body
    const estabelecimentoId = estabelecimentoIdBody || (req as any).estabelecimentoId;
    if (!estabelecimentoId || !mesaNumero || !Array.isArray(itens) || itens.length === 0) return res.status(400).json({ error: 'Dados incompletos' });

    // buscar ou criar mesa
    let mesa = await prisma.mesa.findFirst({ where: { numero: String(mesaNumero), estabelecimentoId } });
    if (!mesa) {
      mesa = await prisma.mesa.create({ data: { numero: String(mesaNumero), estabelecimentoId } });
    }

    // garantir que cada item tem produtoId e quantidade
    const invalid = itens.some((it: any) => !it || typeof it.produtoId !== 'number' || typeof it.quantidade !== 'number');
    if (invalid) return res.status(400).json({ error: 'Itens inválidos' });

    // buscar preços dos produtos para preencher precoUnitario
    const produtoIds = Array.from(new Set(itens.map((it: any) => it.produtoId)));
    const produtos = await prisma.produto.findMany({ where: { id: { in: produtoIds }, estabelecimentoId } });
    const precoMap: Record<number, number> = {};
    produtos.forEach(p => { precoMap[p.id] = Number(p.preco); });

    const preparedItens = itens.map((it: any) => ({
      produtoId: it.produtoId,
      quantidade: it.quantidade,
      precoUnitario: precoMap[it.produtoId] ?? 0
    }));

    const total = preparedItens.reduce((acc: number, i: any) => acc + (i.precoUnitario ?? 0) * (i.quantidade ?? 0), 0);

    // se garcomId não enviado, tentar usar um garçom qualquer do estabelecimento
    let finalGarcomId = garcomId;
    if (!finalGarcomId) {
      const someGarcom = await prisma.garcom.findFirst({ where: { estabelecimentoId } });
      if (someGarcom) finalGarcomId = someGarcom.id;
    }
    if (!finalGarcomId) return res.status(400).json({ error: 'Garçom não identificado' });

    const pedido = await prisma.pedido.create({
      data: {
        mesaId: mesa.id,
        garcomId: finalGarcomId,
        estabelecimentoId,
        status: 'ENVIADO',
        total: total,
        itens: {
          create: preparedItens
        }
      },
      include: { itens: true }
    });

    // broadcast novo pedido — tente persistir notificação, mas garanta broadcast mesmo se persistência falhar
    let notifId: number | null = null;
    try {
      const notif = await prisma.notification.create({ data: {
        tipo: 'pedido_created',
        pedidoId: pedido.id,
        mesaId: mesa.id,
        titulo: `Novo pedido — Mesa ${mesa.numero}`,
        body: (pedido.itens || []).map((it:any) => `${it.quantidade}x`).join(', '),
        estabelecimentoId
      } });
      notifId = notif.id;
    } catch (err) {
      // persistência falhou — log para diagnóstico, mas continuar
      // eslint-disable-next-line no-console
      console.warn('Falha ao criar Notification (continuando com broadcast):', err);
    }
    try {
      broadcast('pedido_created', { notificationId: notifId, pedido: { id: pedido.id, mesaId: pedido.mesaId, mesaNumero: mesa.numero, itens: pedido.itens, status: pedido.status }, estabelecimentoId });
    } catch (err) { /* ignore broadcast errors */ }

    return res.json({ sucesso: true, pedido });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

  // Atualizar quantidade de um item do pedido
  router.patch('/itens/:itemId', async (req, res) => {
    try {
      const itemId = Number(req.params.itemId);
      const { quantidade } = req.body;
      if (Number.isNaN(itemId) || typeof quantidade !== 'number' || quantidade < 0) return res.status(400).json({ error: 'Parâmetros inválidos' });

      const item = await prisma.itemPedido.findUnique({ where: { id: itemId } });
      if (!item) return res.status(404).json({ error: 'Item não encontrado' });

      if (quantidade === 0) {
        // remover item
        await prisma.itemPedido.delete({ where: { id: itemId } });
      } else {
        await prisma.itemPedido.update({ where: { id: itemId }, data: { quantidade } });
      }

      // recalcular total do pedido
      const pedidoId = item.pedidoId;
      const itens = await prisma.itemPedido.findMany({ where: { pedidoId } });
      const total = itens.reduce((acc, it) => acc + (it.precoUnitario || 0) * (it.quantidade || 0), 0);
      await prisma.pedido.update({ where: { id: pedidoId }, data: { total } });

      const pedidoAtualizado = await prisma.pedido.findUnique({ where: { id: pedidoId }, include: { itens: true, mesa: true } });
      try {
        let notifId: number | null = null;
        try {
          const notif = await prisma.notification.create({ data: {
            tipo: 'pedido_updated',
            pedidoId: pedidoAtualizado?.id || undefined,
            mesaId: pedidoAtualizado?.mesaId || undefined,
            titulo: `Pedido atualizado — Mesa ${pedidoAtualizado?.mesa?.numero ?? ''}`,
            body: `Pedido #${pedidoAtualizado?.id} atualizado`,
            estabelecimentoId: pedidoAtualizado?.estabelecimentoId || undefined
          } });
          notifId = notif.id;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Falha ao criar Notification (pedido_updated):', err);
        }
        try { broadcast('pedido_updated', { notificationId: notifId, pedido: pedidoAtualizado }); } catch (err) { /* ignore */ }
      } catch (e) { /* ignore */ }
      return res.json({ sucesso: true, pedido: pedidoAtualizado });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return res.status(500).json({ error: 'Erro ao atualizar item' });
    }
  });

  // Remover item explicitamente
  router.delete('/itens/:itemId', async (req, res) => {
    try {
      const itemId = Number(req.params.itemId);
      if (Number.isNaN(itemId)) return res.status(400).json({ error: 'Parâmetros inválidos' });
      const item = await prisma.itemPedido.findUnique({ where: { id: itemId } });
      if (!item) return res.status(404).json({ error: 'Item não encontrado' });
      const pedidoId = item.pedidoId;
      await prisma.itemPedido.delete({ where: { id: itemId } });
      const itens = await prisma.itemPedido.findMany({ where: { pedidoId } });
      const total = itens.reduce((acc, it) => acc + (it.precoUnitario || 0) * (it.quantidade || 0), 0);
      await prisma.pedido.update({ where: { id: pedidoId }, data: { total } });
      const pedidoAtualizado = await prisma.pedido.findUnique({ where: { id: pedidoId }, include: { itens: true, mesa: true } });
      try {
        let notifId: number | null = null;
        try {
          const notif = await prisma.notification.create({ data: {
            tipo: 'pedido_updated',
            pedidoId: pedidoAtualizado?.id || undefined,
            mesaId: pedidoAtualizado?.mesaId || undefined,
            titulo: `Pedido atualizado — Mesa ${pedidoAtualizado?.mesa?.numero ?? ''}`,
            body: `Pedido #${pedidoAtualizado?.id} atualizado`,
            estabelecimentoId: pedidoAtualizado?.estabelecimentoId || undefined
          } });
          notifId = notif.id;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Falha ao criar Notification (pedido_updated - delete flow):', err);
        }
        try { broadcast('pedido_updated', { notificationId: notifId, pedido: pedidoAtualizado }); } catch (err) { /* ignore */ }
      } catch (e) { /* ignore */ }
      return res.json({ sucesso: true, pedido: pedidoAtualizado });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return res.status(500).json({ error: 'Erro ao remover item' });
    }
  });

  // Atualizar status do pedido (ex: SERVIDO)
  router.patch('/:pedidoId/status', async (req, res) => {
    try {
      const pedidoId = Number(req.params.pedidoId);
      const { status } = req.body;
      if (Number.isNaN(pedidoId) || !status) return res.status(400).json({ error: 'Parâmetros inválidos' });
      const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
      if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });
      const upd = await prisma.pedido.update({ where: { id: pedidoId }, data: { status }, include: { itens: true, mesa: true } });
      try {
        let notifId: number | null = null;
        try {
          const notif = await prisma.notification.create({ data: {
            tipo: 'pedido_updated',
            pedidoId: upd?.id || undefined,
            mesaId: upd?.mesaId || undefined,
            titulo: `Pedido atualizado — Mesa ${upd?.mesa?.numero ?? ''}`,
            body: `Pedido #${upd?.id} agora: ${upd?.status}`,
            estabelecimentoId: upd?.estabelecimentoId || undefined
          } });
          notifId = notif.id;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Falha ao criar Notification (pedido status):', err);
        }
        try { broadcast('pedido_updated', { notificationId: notifId, pedido: upd }); } catch (err) { /* ignore */ }
      } catch (e) { /* ignore */ }
      return res.json({ sucesso: true });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  });

export default router;
