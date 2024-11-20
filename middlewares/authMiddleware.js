// authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Token não fornecido');
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[AUTH] Token inválido:', err);
      return res.status(403).json({ message: 'Token inválido.' });
    }
  
    console.log('[AUTH] Token verificado com sucesso para o usuário:', user);
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
