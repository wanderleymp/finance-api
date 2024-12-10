"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
const authService_1 = require("../services/authService");
const logger_1 = __importDefault(require("../config/logger"));
function authMiddleware(req, res, next) {
    // Extrair token do cabeçalho de autorização
    const authHeader = req.headers.authorization;
    console.log('Headers recebidos:', req.headers);
    logger_1.default.info('Headers de autorização recebidos', { headers: req.headers });
    if (!authHeader) {
        logger_1.default.warn('Tentativa de acesso sem token');
        return res.status(401).json({
            message: 'Token de autenticação não fornecido'
        });
    }
    // Verificar formato do token
    const parts = authHeader.split(' ');
    console.log('Partes do token:', parts);
    logger_1.default.info('Partes do token', { parts });
    if (parts.length !== 2) {
        logger_1.default.warn('Formato de token inválido');
        return res.status(401).json({
            message: 'Formato de token inválido'
        });
    }
    const [scheme, token] = parts;
    // Verificar esquema Bearer
    if (!/^Bearer$/i.test(scheme)) {
        logger_1.default.warn('Esquema de token inválido');
        return res.status(401).json({
            message: 'Token mal formatado'
        });
    }
    try {
        // Verificar token
        console.log('Token a ser verificado:', token);
        const decoded = (0, authService_1.verifyToken)(token);
        console.log('Token decodificado:', decoded);
        logger_1.default.info('Token decodificado com sucesso', { decoded });
        // Adicionar informações do usuário à requisição
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Erro na verificação do token:', error);
        logger_1.default.error('Erro na autenticação', error);
        return res.status(401).json({
            message: 'Token inválido ou expirado',
            error: error.message
        });
    }
}
// Middleware para rotas de admin
function adminMiddleware(req, res, next) {
    const user = req.user;
    console.log('Verificando permissão de admin. Usuário:', user);
    logger_1.default.info('Verificando permissão de admin', { user });
    if (!user || user.role?.toLowerCase() !== 'admin') {
        console.warn('Tentativa de acesso não autorizada. Usuário:', user);
        logger_1.default.warn('Tentativa de acesso não autorizada', { user });
        return res.status(403).json({
            message: 'Acesso restrito a administradores',
            userRole: user?.role
        });
    }
    next();
}
