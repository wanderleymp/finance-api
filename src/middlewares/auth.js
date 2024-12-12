const JwtService = require('../config/jwt');

const authMiddleware = (req, res, next) => {
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

  req.userId = decoded.id;
  return next();
};

module.exports = authMiddleware;
