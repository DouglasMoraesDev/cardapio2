import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'troque_esta_chave_em_producao';

// Register a dev user. In production you may want to restrict this.
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const existing = await prisma.devUser.findUnique({ where: { username } });
    if (existing) return res.status(409).json({ error: 'Usuario já existe' });
    const senhaHash = await bcrypt.hash(password, 10);
    const created = await prisma.devUser.create({ data: { username, passwordHash: senhaHash, role: 'dev' } });
    return res.json({ sucesso: true, user: { id: created.id, username: created.username } });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// Login dev user -> returns token
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const user = await prisma.devUser.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign({ devId: user.id, role: user.role || 'dev' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ sucesso: true, token, user: { id: user.id, username: user.username } });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// List dev users (dev only; restrict in production)
router.get('/', async (_req, res) => {
  try {
    const isDevMode = process.env.NODE_ENV !== 'production';
    if (!isDevMode) return res.status(403).json({ error: 'Forbidden' });
    const users = await prisma.devUser.findMany({ select: { id: true, username: true, criadoEm: true, role: true } });
    return res.json(users);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
