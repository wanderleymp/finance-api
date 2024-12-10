"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }
    const [, token] = authHeader.split(' ');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        // Buscar usuário no banco para verificar status
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                user_name: true,
                status: true,
                role: true
            }
        });
        if (!user) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }
        // Verificar status do usuário
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Conta inativa ou bloqueada' });
        }
        // Adicionar informações do usuário ao request
        req.user = {
            id: user.id,
            user_name: user.user_name,
            role: user.role
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Erro na autenticação JWT', { error });
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expirado' });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: 'Token inválido' });
        }
        return res.status(500).json({ message: 'Erro interno de autenticação' });
    }
};
exports.authenticateJWT = authenticateJWT;
const requirePermission = (requiredPermissions) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Não autenticado' });
        }
        try {
            // Buscar permissões do usuário
            const userWithRoles = await prisma_1.default.user.findUnique({
                where: { id: req.user.id },
                include: {
                    roles: {
                        include: {
                            permissions: true
                        }
                    }
                }
            });
            if (!userWithRoles) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }
            // Verificar se o usuário tem alguma das permissões necessárias
            const userPermissions = userWithRoles.roles.flatMap(role => role.permissions.map(p => p.name));
            const hasRequiredPermission = requiredPermissions.some(permission => userPermissions.includes(permission));
            if (!hasRequiredPermission) {
                logger_1.default.warn('Acesso negado', {
                    user: req.user.id,
                    requiredPermissions,
                    userPermissions
                });
                return res.status(403).json({
                    message: 'Acesso negado. Permissões insuficientes.',
                    requiredPermissions,
                    userPermissions
                });
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Erro na verificação de permissões', { error });
            return res.status(500).json({ message: 'Erro na verificação de permissões' });
        }
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=jwtMiddleware.js.map