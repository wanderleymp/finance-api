const JwtService = require('../config/jwt');

const authMiddleware = (req, res, next) => {
  // Rotas públicas que não requerem autenticação
  const publicRoutes = [
    { path: '/users/login', method: 'POST' },
    { path: '/users/register', method: 'POST' },
    { path: /^\/users\/\d+\/password$/, method: 'PATCH' }
  ];

  // Verificar se a rota atual é pública
  const isPublicRoute = publicRoutes.some(route => {
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
    return res.status(401).json({ 
      error: 'Token não fornecido',
      message: 'É necessário estar autenticado para acessar este recurso.'
    });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ 
      error: 'Erro no token',
      message: 'O token deve estar no formato "Bearer TOKEN".'
    });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ 
      error: 'Token mal formatado',
      message: 'O token deve começar com "Bearer".'
    });
  }

  const decoded = JwtService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ 
      error: 'Token inválido',
      message: 'O token de autenticação é inválido ou expirou.'
    });
  }

  req.user = {
    ...decoded,
    isAdmin: decoded.profile_id === 1, // Assumindo que profile_id 1 é admin
    user_id: decoded.user_id
  };

  return next();
};

module.exports = { authMiddleware };
