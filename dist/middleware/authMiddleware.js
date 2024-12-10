"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
exports.loginAttemptMiddleware = loginAttemptMiddleware;
const authService_1 = require("../services/authService");
const logger_1 = __importDefault(require("../config/logger"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
async function authMiddleware(req, res, next) {
    // Extrair token do cabeçalho de autorização
    const authHeader = req.headers.authorization;
    console.log(' DEBUG - Rota acessada:', req.path);
    console.log(' DEBUG - Headers completos:', JSON.stringify(req.headers, null, 2));
    logger_1.default.info('Headers de autorização recebidos', {
        path: req.path,
        headers: req.headers
    });
    if (!authHeader) {
        console.log(' DEBUG - Sem token de autorização');
        logger_1.default.warn('Tentativa de acesso sem token', { path: req.path });
        return res.status(401).json({
            message: 'Token de autenticação não fornecido',
            path: req.path
        });
    }
    // Verificar formato do token
    const parts = authHeader.split(' ');
    console.log(' DEBUG - Partes do token:', parts);
    logger_1.default.info('Partes do token', { parts });
    if (parts.length !== 2) {
        console.log(' DEBUG - Formato de token inválido');
        logger_1.default.warn('Formato de token inválido', { parts });
        return res.status(401).json({
            message: 'Formato de token inválido',
            parts: parts
        });
    }
    const [scheme, token] = parts;
    // Verificar esquema Bearer
    if (!/^Bearer$/i.test(scheme)) {
        console.log(' DEBUG - Esquema de token inválido');
        logger_1.default.warn('Esquema de token inválido', { scheme });
        return res.status(401).json({
            message: 'Token mal formatado',
            scheme: scheme
        });
    }
    try {
        // Verificar token
        console.log(' DEBUG - Token a ser verificado:', token);
        const decoded = (0, authService_1.verifyToken)(token);
        // Garantir que o decoded não seja uma Promise
        const userInfo = decoded instanceof Promise ? await decoded : decoded;
        console.log(' DEBUG - Token decodificado:', userInfo);
        logger_1.default.info('Token decodificado com sucesso', { decoded: userInfo });
        // Adicionar informações do usuário à requisição
        req.user = userInfo;
        next();
    }
    catch (error) {
        console.log(' DEBUG - Erro na verificação do token:', error);
        logger_1.default.error('Erro na autenticação', {
            error: error,
            token: token
        });
        return res.status(401).json({
            message: 'Token inválido ou expirado',
            error: error.message
        });
    }
}
// Middleware para rotas de admin
function adminMiddleware(req, res, next) {
    const user = req.user;
    console.log(' DEBUG - Verificando permissão de admin. Usuário:', user);
    logger_1.default.info('Verificando permissão de admin', { user });
    // Adicione um log detalhado para entender o tipo de user.role
    console.log(' DEBUG - Tipo de user.role:', typeof user?.role);
    console.log(' DEBUG - Valor de user.role:', user?.role);
    // Modifique a verificação para ser mais robusta
    if (!user ||
        (typeof user.role !== 'string') ||
        (user.role.toLowerCase() !== 'admin')) {
        console.log(' DEBUG - Tentativa de acesso não autorizada. Usuário:', user);
        logger_1.default.warn('Tentativa de acesso não autorizada', { user });
        return res.status(403).json({
            message: 'Acesso restrito a administradores',
            userRole: user?.role
        });
    }
    next();
}
// Middleware para registrar tentativas de login
async function loginAttemptMiddleware(req, res, next) {
    const { user_name } = req.body;
    try {
        // Middleware de login bem-sucedido
        res.on('finish', async () => {
            if (res.statusCode === 200) {
                // Login bem-sucedido
                await notificationService_1.default.createNotification({
                    type: 'LOGIN_SUCCESSFUL',
                    description: `Login realizado: ${user_name}`,
                    metadata: {
                        username: user_name,
                        ip: req.ip
                    }
                });
            }
            else if (res.statusCode === 401 || res.statusCode === 403) {
                // Login mal-sucedido
                await notificationService_1.default.createNotification({
                    type: 'LOGIN_FAILED',
                    description: `Tentativa de login falha: ${user_name}`,
                    metadata: {
                        username: user_name,
                        ip: req.ip,
                        status: res.statusCode
                    }
                });
            }
        });
        next();
    }
    catch (error) {
        console.error('Erro ao registrar tentativa de login', error);
        logger_1.default.error('Erro ao registrar tentativa de login', error);
        next();
    }
}
//# sourceMappingURL=authMiddleware.js.map