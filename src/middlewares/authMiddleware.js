const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        logger.warn('Tentativa de acesso sem token de autenticação');
        return res.status(401).json({
            success: false,
            message: 'Token de autenticação não fornecido'
        });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        logger.warn('Formato de token inválido');
        return res.status(401).json({
            success: false,
            message: 'Formato de token inválido'
        });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        logger.warn('Token mal formatado');
        return res.status(401).json({
            success: false,
            message: 'Token mal formatado'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Adiciona informações do usuário ao request para uso posterior
        req.userId = decoded.user_id;
        req.username = decoded.username;

        next();
    } catch (error) {
        logger.error('Erro na validação do token', { error: error.message });
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

module.exports = authMiddleware;
