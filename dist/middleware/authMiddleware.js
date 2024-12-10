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
    if (!authHeader) {
        logger_1.default.warn('Tentativa de acesso sem token');
        return res.status(401).json({
            message: 'Token de autenticação não fornecido'
        });
    }
    // Verificar formato do token
    const parts = authHeader.split(' ');
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
        const decoded = (0, authService_1.verifyToken)(token);
        // Adicionar informações do usuário à requisição
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.default.error('Erro na autenticação', error);
        return res.status(401).json({
            message: 'Token inválido ou expirado'
        });
    }
}
// Middleware para rotas de admin
function adminMiddleware(req, res, next) {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        logger_1.default.warn('Tentativa de acesso não autorizada');
        return res.status(403).json({
            message: 'Acesso restrito a administradores'
        });
    }
    next();
}
