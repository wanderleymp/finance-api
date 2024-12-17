const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

const authMiddleware = (req, res, next) => {
    logger.info('Middleware de autenticação chamado', {
        path: req.path,
        method: req.method,
        headers: req.headers
    });

    console.log('Middleware de autenticação chamado', {
        path: req.path,
        method: req.method,
        headers: req.headers,
        authorization: req.headers.authorization
    });

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
        
        // Adiciona objeto user para compatibilidade
        req.user = {
            user_id: decoded.user_id,
            username: decoded.username,
            profile_id: decoded.profile_id || null,
            person_id: decoded.person_id || null,
            licenses: decoded.licenses || []
        };

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
