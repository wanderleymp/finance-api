import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import logger from '../config/logger';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extrair token do cabeçalho de autorização
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logger.warn('Tentativa de acesso sem token');
    return res.status(401).json({ 
      message: 'Token de autenticação não fornecido' 
    });
  }

  // Verificar formato do token
  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    logger.warn('Formato de token inválido');
    return res.status(401).json({ 
      message: 'Formato de token inválido' 
    });
  }

  const [scheme, token] = parts;

  // Verificar esquema Bearer
  if (!/^Bearer$/i.test(scheme)) {
    logger.warn('Esquema de token inválido');
    return res.status(401).json({ 
      message: 'Token mal formatado' 
    });
  }

  try {
    // Verificar token
    const decoded = verifyToken(token);
    
    // Adicionar informações do usuário à requisição
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    logger.error('Erro na autenticação', error);
    return res.status(401).json({ 
      message: 'Token inválido ou expirado' 
    });
  }
}

// Middleware para rotas de admin
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    logger.warn('Tentativa de acesso não autorizada');
    return res.status(403).json({ 
      message: 'Acesso restrito a administradores' 
    });
  }

  next();
}
