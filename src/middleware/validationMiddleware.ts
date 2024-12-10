import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_name, password } = req.body;

    // Validar nome de usuário
    if (!user_name) {
      logger.warn('Tentativa de login sem nome de usuário');
      return res.status(400).json({ message: 'Nome de usuário é obrigatório' });
    }

    // Validar senha
    if (!password) {
      logger.warn('Tentativa de login sem senha');
      return res.status(400).json({ message: 'Senha é obrigatória' });
    }

    next();
  } catch (error) {
    logger.error('Erro na validação de login', error);
    res.status(500).json({ 
      message: 'Erro na validação de login',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Ocorreu um erro inesperado'
    });
  }
}

export function validateRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_name, password } = req.body;

    // Validar nome de usuário
    if (!user_name) {
      logger.warn('Tentativa de registro sem nome de usuário');
      return res.status(400).json({ message: 'Nome de usuário é obrigatório' });
    }

    // Validar comprimento do nome de usuário
    if (user_name.length < 3 || user_name.length > 50) {
      logger.warn(`Nome de usuário inválido: ${user_name}`);
      return res.status(400).json({ message: 'Nome de usuário deve ter entre 3 e 50 caracteres' });
    }

    // Validar senha
    if (!password) {
      logger.warn('Tentativa de registro sem senha');
      return res.status(400).json({ message: 'Senha é obrigatória' });
    }

    // Validar comprimento da senha
    if (password.length < 8 || password.length > 100) {
      logger.warn('Senha não atende aos requisitos de comprimento');
      return res.status(400).json({ message: 'Senha deve ter entre 8 e 100 caracteres' });
    }

    // Validar força de senha (exemplo: pelo menos 1 letra maiúscula, 1 minúscula, 1 número)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      logger.warn('Senha não atende aos requisitos de complexidade');
      return res.status(400).json({ 
        message: 'Senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula e 1 número' 
      });
    }

    next();
  } catch (error) {
    logger.error('Erro na validação de registro', error);
    res.status(500).json({ 
      message: 'Erro na validação de registro',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Ocorreu um erro inesperado'
    });
  }
}

export function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Erro não tratado:', {
    error: err,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado'
  });
}
