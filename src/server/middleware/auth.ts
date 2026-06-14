import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface JwtPayload {
  userId: number;
  role: 'admin' | 'customer';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;

  if (!token) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authentification requise.'));
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, 'TOKEN_EXPIRED', 'Token invalide ou expiré.'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    next(new AppError(403, 'FORBIDDEN', 'Accès réservé aux administrateurs.'));
    return;
  }
  next();
}
