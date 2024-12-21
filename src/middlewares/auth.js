const JwtService = require('../config/jwt');
const { logger } = require('./logger');

const PUBLIC_ROUTES = [
  { path: '/auth/login', method: 'POST' },
  { path: '/auth/refresh-token', method: 'POST' },
  { path: '/users/register', method: 'POST' },
  { path: '/health', method: 'GET' },
  { path: '/status', method: 'GET' }
];

const authMiddleware = (req, res, next) => {
  try {
    // Verificar se a rota atual é pública
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
      if (typeof route.path === 'string') {
        return route.path === req.path && route.method === req.method;
      }
      return route.path.test(req.path) && route.method === req.method;
    });

    if (isPublicRoute) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      return res.status(401).json({ error: 'Token malformed' });
    }

    const token = parts[1];
    const decoded = JwtService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Adiciona informações do usuário ao request
    req.user = {
      user_id: decoded.user_id,
      username: decoded.username,
      profile_id: decoded.profile_id,
      isAdmin: decoded.profile_id === 1
    };

    return next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};

module.exports = { 
  authMiddleware,
  PUBLIC_ROUTES // Exportando para uso em testes ou documentação
};
