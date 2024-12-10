"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.checkUserStatus = checkUserStatus;
function requireRole(requiredRole) {
    return (req, res, next) => {
        // Verificar se usuário está autenticado
        if (!req.user) {
            return res.status(401).json({ message: 'Não autenticado' });
        }
        // Verificar permissão
        if (!req.user.hasPermission(requiredRole)) {
            return res.status(403).json({
                message: 'Sem permissão para realizar esta ação',
                requiredRole,
                userRole: req.user.role
            });
        }
        next();
    };
}
// Middleware para verificar status do usuário
function checkUserStatus(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
    }
    switch (req.user.status) {
        case 'INACTIVE':
            return res.status(403).json({ message: 'Conta inativa' });
        case 'BLOCKED':
            return res.status(403).json({ message: 'Conta bloqueada' });
        case 'ACTIVE':
            return next();
        default:
            return res.status(403).json({ message: 'Status de conta inválido' });
    }
}
//# sourceMappingURL=authorizationMiddleware.js.map