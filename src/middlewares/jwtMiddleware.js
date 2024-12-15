const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

class JwtMiddleware {
    // Gerar token JWT
    static generateToken(payload, expiresIn = '24h') {
        try {
            return jwt.sign(payload, JWT_SECRET, { expiresIn });
        } catch (error) {
            logger.error('Erro ao gerar token JWT', { 
                error: error.message,
                payload: Object.keys(payload)
            });
            throw new Error('Falha na geração do token');
        }
    }

    // Middleware de autenticação
    static authenticate(req, res, next) {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                status: 'error',
                message: 'Token de autenticação não fornecido'
            });
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2) {
            return res.status(401).json({
                status: 'error', 
                message: 'Formato de token inválido'
            });
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({
                status: 'error',
                message: 'Token mal formatado'
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Adiciona informações do usuário ao request
            req.user = {
                user_id: decoded.user_id,
                username: decoded.username,
                profile_id: decoded.profile_id
            };

            logger.info('Autenticação JWT bem-sucedida', { 
                userId: decoded.user_id,
                username: decoded.username
            });

            next();
        } catch (error) {
            logger.warn('Falha na autenticação JWT', { 
                error: error.message 
            });

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'error',
                    message: 'Token expirado'
                });
            }

            return res.status(401).json({
                status: 'error',
                message: 'Token inválido'
            });
        }
    }

    // Verificar token sem middleware
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            logger.error('Erro na verificação do token', { 
                error: error.message 
            });
            return null;
        }
    }
}

module.exports = JwtMiddleware;
