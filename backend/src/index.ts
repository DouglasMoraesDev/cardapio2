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
import notificationsRouter from './routes/notifications';
import avaliacoesRouter from './routes/avaliacoes';

dotenv.config();
import { execSync } from 'child_process';

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
app.use('/api/notifications', notificationsRouter);
app.use('/api/avaliacoes', avaliacoesRouter);

// Health check para plataformas de deploy
app.get('/_health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Servir frontend (build) em produção. Procurar por build em duas localizações comuns:
// 1) root/dist  (quando o frontend foi construído no root)
// 2) ../frontend/dist (quando o frontend foi construído na pasta frontend)
const possibleFrontends = [
  path.join(__dirname, '..', '..', 'dist'),
  path.join(__dirname, '..', '..', 'frontend', 'dist')
];
const existing = possibleFrontends.find(p => fs.existsSync(p));
if (existing) {
  app.use(express.static(existing));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(existing, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('Backend rodando. Frontend não encontrado (procurei em root/dist e frontend/dist).');
  });
}

const PORT = process.env.PORT || 4000;
const shouldRunMigrations = (process.env.PRISMA_MIGRATE_ON_STARTUP === 'true') || (process.env.NODE_ENV === 'production');

const start = async () => {
  if (shouldRunMigrations) {
    try {
      console.log('PRISMA: running `prisma migrate deploy` before starting server');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } catch (err) {
      console.error('PRISMA: migrate deploy failed', err);
      // If migrations fail in production it's safer to exit with error
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor backend rodando na porta ${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`DATABASE_URL=${process.env.DATABASE_URL ? '[set]' : '[not set]'}`);
  });
};

start();
