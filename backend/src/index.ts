import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import estabelecimentosRouter from './routes/estabelecimentos';
import authRouter from './routes/auth';
import produtosRouter from './routes/produtos';
import pedidosRouter from './routes/pedidos';
import mesasRouter from './routes/mesas';
import pedidosRouter from './routes/pedidos';
import mesasRouter from './routes/mesas';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/estabelecimentos', estabelecimentosRouter);
app.use('/api/auth', authRouter);
app.use('/api/produtos', produtosRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/mesas', mesasRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/mesas', mesasRouter);

// Servir frontend (build) em produção — assumir frontend/dist
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
