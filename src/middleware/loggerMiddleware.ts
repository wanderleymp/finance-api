import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const method = req.method;
  const path = req.path;

  // Log de requisição
  logger.info(`[${method}] ${path}`, {
    method,
    path,
    body: Object.keys(req.body).length ? req.body : undefined,
    query: Object.keys(req.query).length ? req.query : undefined,
    ip: req.ip
  });

  // Sobrescrever método end para log de resposta
  const originalEnd = res.end;
  res.end = function(this: any, chunk?: any, encoding?: BufferEncoding, cb?: () => void) {
    const duration = Date.now() - startTime;
    
    logger.info(`[${method}] ${path} - ${res.statusCode}`, {
      method,
      path,
      statusCode: res.statusCode,
      duration
    });

    // Chamar o método original
    return originalEnd.call(this, chunk, encoding || 'utf8', cb);
  } as any;

  next();
}
