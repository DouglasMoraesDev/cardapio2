import { Router } from 'express';
import prisma from '../prismaClient';

const router = Router();

// Criar pedido para uma mesa (cria mesa se necessário)
router.post('/', async (req, res) => {
  try {
    const { estabelecimentoId: estabelecimentoIdBody, mesaNumero, itens, garcomId } = req.body;
    // tentar obter estabelecimentoId do token (se presente) ou do body
    const estabelecimentoId = estabelecimentoIdBody || (req as any).estabelecimentoId;
    if (!estabelecimentoId || !mesaNumero || !Array.isArray(itens)) return res.status(400).json({ error: 'Dados incompletos' });

    // buscar ou criar mesa
    let mesa = await prisma.mesa.findFirst({ where: { numero: String(mesaNumero), estabelecimentoId } });
    if (!mesa) {
      mesa = await prisma.mesa.create({ data: { numero: String(mesaNumero), estabelecimentoId } });
    }

    const total = itens.reduce((acc: number, i: any) => acc + (i.precoUnitario ?? 0) * (i.quantidade ?? 0), 0);

    const pedido = await prisma.pedido.create({
      data: {
        mesaId: mesa.id,
        garcomId: garcomId || null,
        estabelecimentoId,
        status: 'ENVIADO',
        total: total,
        itens: {
          create: itens.map((it: any) => ({ produtoId: it.produtoId, quantidade: it.quantidade, precoUnitario: it.precoUnitario }))
        }
      },
      include: { itens: true }
    });

    return res.json({ sucesso: true, pedido });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

export default router;
