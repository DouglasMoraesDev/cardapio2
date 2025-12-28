import { Router } from 'express';
import prisma from '../prismaClient';
import verificarToken from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`),
});
const upload = multer({ storage });

// Upload de arquivo (retorna URL relativa)
router.post('/upload', verificarToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
  const rel = `/uploads/${req.file.filename}`;
  return res.json({ url: rel });
});

// Listar produtos de um estabelecimento (pode vir o estabelecimentoId na query ou do token)
router.get('/', async (req, res) => {
  const estabelecimentoIdQuery = req.query.estabelecimentoId ? Number(req.query.estabelecimentoId) : undefined;
  const estabelecimentoIdToken = (req as any).estabelecimentoId;
  const estabelecimentoId = estabelecimentoIdQuery || estabelecimentoIdToken;
  if (!estabelecimentoId) return res.status(400).json({ error: 'estabelecimentoId é obrigatório' });
  try {
    const produtos = await prisma.produto.findMany({ where: { estabelecimentoId }, include: { categoria: true } });
    return res.json(produtos);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Obter produto por id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });
  try {
    const produto = await prisma.produto.findUnique({ where: { id }, include: { categoria: true } });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    return res.json(produto);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// Criar produto — exige autenticação e usa estabelecimento do token
router.post('/', verificarToken, async (req, res) => {
  const { nome, preco, descricao, categoriaId, imagem_url } = req.body;
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!estabelecimentoId || !nome || preco == null) return res.status(400).json({ error: 'Dados incompletos' });
  try {
    const data: any = { nome, preco: Number(preco), descricao: descricao || '', estabelecimentoId };
    if (categoriaId !== undefined && categoriaId !== null && categoriaId !== '') data.categoriaId = Number(categoriaId);
    if (imagem_url) data.imagem_url = imagem_url;
    const produto = await prisma.produto.create({ data });
    return res.json(produto);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Atualizar produto
router.put('/:id', verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  const { nome, preco, descricao, categoriaId, imagem_url } = req.body;
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!id) return res.status(400).json({ error: 'id inválido' });
  try {
    const prod = await prisma.produto.findUnique({ where: { id } });
    if (!prod || prod.estabelecimentoId !== estabelecimentoId) return res.status(404).json({ error: 'Produto não encontrado' });
    const data: any = {};
    if (nome !== undefined) data.nome = nome;
    if (preco !== undefined) data.preco = Number(preco);
    if (descricao !== undefined) data.descricao = descricao;
    if (Object.prototype.hasOwnProperty.call(req.body, 'categoriaId')) data.categoriaId = categoriaId === null || categoriaId === '' ? null : Number(categoriaId);
    if (imagem_url !== undefined) data.imagem_url = imagem_url;
    const updated = await prisma.produto.update({ where: { id }, data });
    return res.json(updated);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Excluir produto
router.delete('/:id', verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  const estabelecimentoId = (req as any).estabelecimentoId;
  if (!id) return res.status(400).json({ error: 'id inválido' });
  try {
    const prod = await prisma.produto.findUnique({ where: { id } });
    if (!prod || prod.estabelecimentoId !== estabelecimentoId) return res.status(404).json({ error: 'Produto não encontrado' });
    await prisma.produto.delete({ where: { id } });
    return res.json({ sucesso: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

export default router;
