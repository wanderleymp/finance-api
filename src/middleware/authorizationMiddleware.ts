import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User';
import { ApiError } from '../utils/apiErrors';

// Declarar tipos para estender o objeto Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        hasPermission: (requiredRole: UserRole) => boolean;
      }
    }
  }
}

export function requireRole(requiredRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verificar se usuário está autenticado
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Verificar permissão
    if (!req.user.hasPermission(requiredRole)) {
      return res.status(403).json({ 
        message: 'Sem permissão para realizar esta ação',
        requiredRole,
        userRole: req.user.role
      });
    }

    next();
  };
}

// Middleware para verificar status do usuário
export function checkUserStatus(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  switch (req.user.status) {
    case 'INACTIVE':
      return res.status(403).json({ message: 'Conta inativa' });
    case 'BLOCKED':
      return res.status(403).json({ message: 'Conta bloqueada' });
    case 'ACTIVE':
      return next();
    default:
      return res.status(403).json({ message: 'Status de conta inválido' });
  }
}
