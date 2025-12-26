import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import estabelecimentosRouter from './routes/estabelecimentos';
import authRouter from './routes/auth';
import produtosRouter from './routes/produtos';
import categoriasRouter from './routes/categorias';
import garconsRouter from './routes/garcons';
import statsRouter from './routes/stats';
import pedidosRouter from './routes/pedidos';
import mesasRouter from './routes/mesas';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir uploads públicos
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'public', 'uploads')));

// Rotas da API
app.use('/api/estabelecimentos', estabelecimentosRouter);
app.use('/api/auth', authRouter);
app.use('/api/produtos', produtosRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/garcons', garconsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/mesas', mesasRouter);

// Health check para plataformas de deploy
app.get('/_health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Servir frontend (build) em produção — assumir frontend/dist
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('Backend rodando. Frontend não encontrado (frontend/dist).');
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor backend rodando na porta ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`DATABASE_URL=${process.env.DATABASE_URL ? '[set]' : '[not set]'}`);
});
