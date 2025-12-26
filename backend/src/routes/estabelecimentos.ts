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

export default router;
