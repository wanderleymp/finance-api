import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiErrors';
import logger from '../config/logger';

export const errorMiddleware = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Log do erro
  logger.error(`Erro: ${err.message}`, {
    method: req.method,
    path: req.path,
    body: req.body
  });

  // Verificar se é um ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.errorDetails,
      status: err.statusCode
    });
  }

  // Tratamento de erros não previstos
  return res.status(500).json({
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    status: 500
  });
};
