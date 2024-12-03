const jwt = require('jsonwebtoken');
const logger = require('../../config/logger');

const authenticateToken = (req, res, next) => {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Headers recebidos:', req.headers);
    console.log('Authorization header:', req.headers['authorization']);

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Token extraído:', token);

    if (!token) {
        console.log('Nenhum token encontrado');
        logger.warn('Tentativa de acesso sem token de autenticação');
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded);
        req.user = decoded;
        logger.info(`Usuário ${decoded.username} autenticado com sucesso`);
        next();
    } catch (error) {
        console.error('Erro na validação do token:', error);
        logger.error(`Erro na validação do token: ${error.message}`);
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
};

module.exports = authenticateToken;
