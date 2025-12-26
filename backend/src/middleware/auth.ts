import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'troque_esta_chave_em_producao';

export interface TokenPayload {
  adminId?: number;
  garcomId?: number;
  estabelecimentoId?: number;
  iat?: number;
  exp?: number;
}

export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token ausente' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Token inválido' });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    // anexar ao req para uso nas rotas
    (req as any).estabelecimentoId = payload.estabelecimentoId;
    (req as any).tokenPayload = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export default verificarToken;
