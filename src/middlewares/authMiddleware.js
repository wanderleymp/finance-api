const jwt = require('jsonwebtoken');
const { logger } = require('./logger');
const licenseService = require('../services/licenseService');

// Rotas isentas de verificação de licença
const LICENSE_FREE_ROUTES = [
    '/movement-payments',
    '/health',
    '/status'
];

console.log('DEBUG: Rotas isentas:', LICENSE_FREE_ROUTES);

const authMiddleware = async (req, res, next) => {
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

    console.log('DEBUG: Rota atual:', req.path);

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
        req.user = decoded;

        // Ignorar verificação de licença para rotas específicas
        if (LICENSE_FREE_ROUTES.some(route => req.path.startsWith(route))) {
            return next();
        }

        // Verificar licenças para outras rotas
        const userLicenses = await licenseService.getLicensesByPerson(decoded.person_id);
        
        console.log('DEBUG: Licenças do usuário', {
            userLicenses,
            userLicensesLength: userLicenses.length
        });

        if (userLicenses.length === 0) {
            return res.status(403).json({ 
                message: 'Usuário não possui licenças ativas' 
            });
        }

        next();
    } catch (error) {
        logger.error('Erro no middleware de autenticação', {
            errorMessage: error.message,
            errorStack: error.stack
        });
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
}

module.exports = authMiddleware;
