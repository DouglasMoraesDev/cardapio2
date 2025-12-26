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

  // start of today UTC-local
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  try {
    const pedidos = await prisma.pedido.findMany({ where: { estabelecimentoId, criadoEm: { gte: start, lt: end } }, select: { id: true, total: true } });
    const totalRevenue = pedidos.reduce((s, p) => s + (p.total || 0), 0);

    const estab = await prisma.estabelecimento.findUnique({ where: { id: estabelecimentoId } });
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

    return res.json({ totalRevenue, totalService, ordersCount, avaliacoesCount, categoriesMostSold, productsMostSold });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao gerar estatísticas' });
  }
});

export default router;
