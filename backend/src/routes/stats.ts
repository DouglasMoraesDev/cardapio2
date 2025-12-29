import { Router } from 'express';
import prisma from '../prismaClient';
import verificarToken from '../middleware/auth';

const router = Router();

// GET /api/stats/daily?estabelecimentoId=1
router.get('/daily', verificarToken, async (req, res) => {
  const estabelecimentoIdQuery = req.query.estabelecimentoId ? Number(req.query.estabelecimentoId) : undefined;
  const estabelecimentoIdToken = (req as any).estabelecimentoId;
  const estabelecimentoId = estabelecimentoIdQuery || estabelecimentoIdToken;
  if (!estabelecimentoId) return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });

  // Determine window: since last fechamento (if any) until now, otherwise start of today
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const estab = await prisma.estabelecimento.findUnique({ where: { id: estabelecimentoId } });
  if (estab && estab.ultimo_fechamento) {
    const last = new Date(estab.ultimo_fechamento as any);
    if (!isNaN(last.getTime()) && last > start) start = last;
  }
  const end = new Date(now);

  try {
    const pedidos = await prisma.pedido.findMany({ where: { estabelecimentoId, criadoEm: { gte: start, lt: end } }, select: { id: true, total: true } });
    const totalRevenue = pedidos.reduce((s, p) => s + (p.total || 0), 0);

    const taxa = estab?.taxa_servico ?? 0;
    const totalService = totalRevenue * (taxa / 100);

    const ordersCount = pedidos.length;

    // avaliações: tabela não implementada ainda — retornar 0
    let avaliacoesCount = 0;
    try {
      if ((prisma as any).avaliacao) {
        avaliacoesCount = await (prisma as any).avaliacao.count({ where: { estabelecimentoId, criadoEm: { gte: start, lt: end } } });
      }
    } catch (e) {
      // ignore if model not present
    }

    // itens vendidos hoje
    const pedidoIds = pedidos.map(p => p.id);
    let categoriesMostSold: Array<any> = [];
    let productsMostSold: Array<any> = [];
    if (pedidoIds.length > 0) {
      const itens = await prisma.itemPedido.findMany({ where: { pedidoId: { in: pedidoIds } }, include: { produto: { include: { categoria: true } } } });

      const catMap = new Map<string, number>();
      const prodMap = new Map<number, { id: number; nome: string; quantidade: number; precoUnitario: number }>();

      for (const it of itens) {
        const q = it.quantidade || 0;
        const catName = it.produto?.categoria?.nome ?? 'Sem categoria';
        catMap.set(catName, (catMap.get(catName) || 0) + q);

        const pid = it.produtoId;
        const nome = it.produto?.nome ?? 'Produto';
        const preco = it.precoUnitario ?? 0;
        const prev = prodMap.get(pid);
        if (prev) prev.quantidade += q;
        else prodMap.set(pid, { id: pid, nome, quantidade: q, precoUnitario: preco });
      }

      categoriesMostSold = Array.from(catMap.entries()).map(([categoria, quantidade]) => ({ categoria, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
      productsMostSold = Array.from(prodMap.values()).sort((a, b) => b.quantidade - a.quantidade);
    }

    return res.json({ totalRevenue, totalService, ordersCount, avaliacoesCount, categoriesMostSold, productsMostSold, janela: { start, end } });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao gerar estatísticas' });
  }
});
// POST /api/stats/close - registra um novo fechamento (cria Fechamento)
router.post('/close', verificarToken, async (req, res) => {
  try {
    const estabelecimentoId = (req as any).estabelecimentoId;
    if (!estabelecimentoId) return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
    const now = new Date();
    // aceitar mesas no body para persistir no fechamento
    const mesasBody = (req.body && req.body.mesas) ? req.body.mesas : undefined;
    // criar registro de fechamento
    const fechamento = await prisma.fechamento.create({ data: { estabelecimentoId, fechadoEm: now, mesas: mesasBody } });
    // também atualizar ultimo_fechamento para compatibilidade
    await prisma.estabelecimento.update({ where: { id: estabelecimentoId }, data: { ultimo_fechamento: now } });
    return res.json({ sucesso: true, fechamento });
  } catch (e) {
    console.error('Erro ao fechar dia', e);
    return res.status(500).json({ error: 'Erro ao fechar dia' });
  }
});

// GET /api/stats/closures - lista fechamentos do estabelecimento
router.get('/closures', verificarToken, async (req, res) => {
  try {
    const estabelecimentoId = (req as any).estabelecimentoId;
    if (!estabelecimentoId) return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
    const list = await prisma.fechamento.findMany({ where: { estabelecimentoId }, orderBy: { fechadoEm: 'desc' } });
    return res.json(list || []);
  } catch (e) {
    console.error('Erro ao listar fechamentos', e);
    return res.status(500).json({ error: 'Erro ao listar fechamentos' });
  }
});

// GET /api/stats/period?start=ISO&end=ISO - estatísticas entre datas
router.get('/period', verificarToken, async (req, res) => {
  try {
    const estabelecimentoId = (req as any).estabelecimentoId;
    if (!estabelecimentoId) return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
    const startQ = req.query.start as string | undefined;
    const endQ = req.query.end as string | undefined;
    if (!startQ || !endQ) return res.status(400).json({ error: 'start e end são obrigatórios (ISO strings)' });
    const start = new Date(startQ);
    const end = new Date(endQ);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: 'datas inválidas' });

    // reutiliza lógica de contagem similar ao /daily
    const pedidos = await prisma.pedido.findMany({ where: { estabelecimentoId, criadoEm: { gte: start, lt: end } }, select: { id: true, total: true } });
    const totalRevenue = pedidos.reduce((s, p) => s + (p.total || 0), 0);
    const estab = await prisma.estabelecimento.findUnique({ where: { id: estabelecimentoId } });
    const taxa = estab?.taxa_servico ?? 0;
    const totalService = totalRevenue * (taxa / 100);
    const ordersCount = pedidos.length;

    let avaliacoesCount = 0;
    try {
      if ((prisma as any).avaliacao) {
        avaliacoesCount = await (prisma as any).avaliacao.count({ where: { estabelecimentoId, criadoEm: { gte: start, lt: end } } });
      }
    } catch (e) {}

    const pedidoIds = pedidos.map(p => p.id);
    let categoriesMostSold: Array<any> = [];
    let productsMostSold: Array<any> = [];
    if (pedidoIds.length > 0) {
      const itens = await prisma.itemPedido.findMany({ where: { pedidoId: { in: pedidoIds } }, include: { produto: { include: { categoria: true } } } });
      const catMap = new Map<string, number>();
      const prodMap = new Map<number, { id: number; nome: string; quantidade: number; precoUnitario: number }>();
      for (const it of itens) {
        const q = it.quantidade || 0;
        const catName = it.produto?.categoria?.nome ?? 'Sem categoria';
        catMap.set(catName, (catMap.get(catName) || 0) + q);
        const pid = it.produtoId;
        const nome = it.produto?.nome ?? 'Produto';
        const preco = it.precoUnitario ?? 0;
        const prev = prodMap.get(pid);
        if (prev) prev.quantidade += q;
        else prodMap.set(pid, { id: pid, nome, quantidade: q, precoUnitario: preco });
      }
      categoriesMostSold = Array.from(catMap.entries()).map(([categoria, quantidade]) => ({ categoria, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
      productsMostSold = Array.from(prodMap.values()).sort((a, b) => b.quantidade - a.quantidade);
    }

    return res.json({ totalRevenue, totalService, ordersCount, avaliacoesCount, categoriesMostSold, productsMostSold, janela: { start, end } });
  } catch (e) {
    console.error('Erro em /stats/period', e);
    return res.status(500).json({ error: 'Erro ao gerar estatísticas para o período' });
  }
});

export default router;
