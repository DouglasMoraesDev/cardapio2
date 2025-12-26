import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';
import verificarToken from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'troque_esta_chave_em_producao';

// Registrar estabelecimento + usuário admin
router.post('/', async (req, res) => {
  try {
    const { establishment, admin } = req.body; // estrutura esperada do frontend
    if (!establishment || !admin) return res.status(400).json({ error: 'Dados incompletos' });

    const senhaHash = await bcrypt.hash(admin.password, 10);

    const novo = await prisma.estabelecimento.create({
      data: {
        nome: establishment.name,
        documento: establishment.document,
        cep: establishment.cep,
        endereco: establishment.address,
        taxa_servico: establishment.serviceTax,
        logo_url: establishment.logoUrl,
        administradores: {
          create: {
            usuario: admin.username,
            senhaHash
          }
        }
      },
      include: { administradores: true }
    });

    // gerar token para admin recém-criado
    const adminCriado = novo.administradores[0];
    const token = jwt.sign({ adminId: adminCriado.id, estabelecimentoId: novo.id }, JWT_SECRET, { expiresIn: '8h' });

    return res.json({ sucesso: true, token, estabelecimentoId: novo.id, estabelecimento: novo });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// Remover estabelecimento e todos os dados relacionados — protegido
router.delete('/:id', verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  try {
    // só permitir remoção se o token pertencer ao mesmo estabelecimento
    const tokenEstab = (req as any).estabelecimentoId;
    if (tokenEstab !== id) return res.status(403).json({ error: 'Permissão negada' });
    await prisma.estabelecimento.delete({ where: { id } });
    return res.json({ sucesso: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao remover estabelecimento' });
  }
});

// Obter estabelecimento atual (com token)
router.get('/me', verificarToken, async (req, res) => {
  try {
    const estabelecimentoId = (req as any).estabelecimentoId;
    const est = await prisma.estabelecimento.findUnique({ where: { id: estabelecimentoId } });
    if (!est) return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    return res.json(est);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao buscar estabelecimento' });
  }
});

// Atualizar configurações do estabelecimento (taxa e tema)
router.put('/me', verificarToken, async (req, res) => {
  try {
    const estabelecimentoId = (req as any).estabelecimentoId;
    const { taxa_servico, tema_fundo_geral, tema_fundo_cartoes, tema_cor_texto, tema_cor_primaria, tema_cor_destaque } = req.body;
    const data: any = {};
    if (taxa_servico !== undefined) data.taxa_servico = Number(taxa_servico);
    if (tema_fundo_geral !== undefined) data.tema_fundo_geral = tema_fundo_geral;
    if (tema_fundo_cartoes !== undefined) data.tema_fundo_cartoes = tema_fundo_cartoes;
    if (tema_cor_texto !== undefined) data.tema_cor_texto = tema_cor_texto;
    if (tema_cor_primaria !== undefined) data.tema_cor_primaria = tema_cor_primaria;
    if (tema_cor_destaque !== undefined) data.tema_cor_destaque = tema_cor_destaque;
    // validações básicas
    if (!estabelecimentoId) return res.status(401).json({ error: 'Token inválido - estabelecimento ausente' });
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    try {
      const updated = await prisma.estabelecimento.update({ where: { id: estabelecimentoId }, data });
      return res.json(updated);
    } catch (err: any) {
      // log detalhado para debugging
      // eslint-disable-next-line no-console
      console.error('Erro Prisma ao atualizar estabelecimento:', err?.message || err);
      return res.status(500).json({ error: 'Erro ao atualizar estabelecimento', details: err?.message });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao atualizar estabelecimento', details: (e as any)?.message });
  }
});

export default router;
