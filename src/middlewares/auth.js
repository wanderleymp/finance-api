const JwtService = require('../config/jwt');
const { logger } = require('./logger');

const PUBLIC_ROUTES = [
  { path: '/auth/login', method: 'POST' },
  { path: '/auth/refresh-token', method: 'POST' },
  { path: '/users/register', method: 'POST' },
  { path: '/health', method: 'GET' },
  { path: '/status', method: 'GET' },
  { path: '/webhooks/graph/messages', method: 'GET' },
  { path: '/webhooks/graph/messages', method: 'POST' },
  { path: '/webhooks/graph/messages', method: 'OPTIONS' }
];

const authMiddleware = (req, res, next) => {
  try {
    // Verifica se a rota é pública
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      route.path === req.path && 
      (route.method === req.method || req.method === 'OPTIONS')
    );

    if (isPublicRoute) {
      logger.info('Rota pública acessada', {
        path: req.path,
        method: req.method
      });
      return next();
    }

    // Se não for rota pública, verifica o token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn('Token não fornecido', {
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'No token provided' });
    }

    const [bearer, token] = authHeader.split(' ');
    if (!/^Bearer$/i.test(bearer) || !token) {
      logger.warn('Token malformado', {
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Token malformed' });
    }

    const decoded = JwtService.verifyToken(token);
    if (!decoded) {
      logger.warn('Token inválido', {
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Adiciona informações do usuário ao request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Erro na autenticação', {
      error: error.message,
      path: req.path,
      method: req.method
    });
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authMiddleware };
