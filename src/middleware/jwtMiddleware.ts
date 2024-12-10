import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import prisma from '../config/prisma';
import logger from '../config/logger';

interface TokenPayload {
  id: string;
  user_name: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    
    // Buscar usuário no banco para verificar status
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        user_name: true, 
        status: true,
        role: true 
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Verificar status do usuário
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Conta inativa ou bloqueada' });
    }

    // Adicionar informações do usuário ao request
    req.user = {
      id: user.id,
      user_name: user.user_name,
      role: user.role
    };

    next();
  } catch (error) {
    logger.error('Erro na autenticação JWT', { error });
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado' });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    return res.status(500).json({ message: 'Erro interno de autenticação' });
  }
};

export const requirePermission = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    try {
      // Buscar permissões do usuário
      const userWithRoles = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { 
          roles: { 
            include: { 
              permissions: true 
            } 
          } 
        }
      });

      if (!userWithRoles) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Verificar se o usuário tem alguma das permissões necessárias
      const userPermissions = userWithRoles.roles.flatMap(
        role => role.permissions.map(p => p.name)
      );

      const hasRequiredPermission = requiredPermissions.some(
        permission => userPermissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        logger.warn('Acesso negado', { 
          user: req.user.id, 
          requiredPermissions,
          userPermissions 
        });
        return res.status(403).json({ 
          message: 'Acesso negado. Permissões insuficientes.',
          requiredPermissions,
          userPermissions
        });
      }

      next();
    } catch (error) {
      logger.error('Erro na verificação de permissões', { error });
      return res.status(500).json({ message: 'Erro na verificação de permissões' });
    }
  };
};
