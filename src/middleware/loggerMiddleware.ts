import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const { method, path, body, query } = req;
  
  // Log de requisição
  logger.info(`[${method}] ${path}`, {
    method,
    path,
    body: Object.keys(body).length ? body : undefined,
    query: Object.keys(query).length ? query : undefined,
    ip: req.ip
  });

  // Capturar tempo de resposta
  const startTime = Date.now();
  
  // Sobrescrever método end para log de resposta
  const originalEnd = res.end;
  res.end = function(chunk?: any) {
    const duration = Date.now() - startTime;
    
    logger.info(`[${method}] ${path} - ${res.statusCode}`, {
      method,
      path,
      status: res.statusCode,
      duration: `${duration}ms`
    });

    // Chamar o método original
    return originalEnd.call(this, chunk);
  } as any;

  next();
}
