import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'troque_esta_chave_em_producao';

// Login admin (retorna token com estabelecimentoId)
router.post('/admin', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    // log minimal para debugging
    // eslint-disable-next-line no-console
    console.log('auth.admin login attempt for usuario:', usuario);
    const admin = await prisma.usuarioAdmin.findFirst({ where: { usuario } });
    if (!admin) return res.status(401).json({ error: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(senha, admin.senhaHash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ adminId: admin.id, estabelecimentoId: admin.estabelecimentoId }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ sucesso: true, token, estabelecimentoId: admin.estabelecimentoId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// Login garçom
router.post('/garcom', async (req, res) => {
  const { nome, senha, estabelecimentoId } = req.body;
  try {
    const garcom = await prisma.garcom.findFirst({ where: { nome, estabelecimentoId } });
    if (!garcom) return res.status(401).json({ error: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(senha, garcom.senhaHash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ garcomId: garcom.id, estabelecimentoId: garcom.estabelecimentoId }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ sucesso: true, token, estabelecimentoId: garcom.estabelecimentoId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
