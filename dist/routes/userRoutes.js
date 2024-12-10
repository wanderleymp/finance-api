"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middleware/authMiddleware");
const logger_1 = __importDefault(require("../config/logger"));
const argon2_1 = __importDefault(require("argon2"));
const userActionLogService_1 = __importDefault(require("../services/userActionLogService"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
console.log(' Carregando rotas de usuários');
logger_1.default.info('Carregando rotas de usuários');
// Middleware de log adicional para depuração
router.use((req, res, next) => {
    console.log(` DEBUG - Rota de usuário acessada: ${req.method} ${req.path}`);
    console.log(` DEBUG - Headers: ${JSON.stringify(req.headers, null, 2)}`);
    next();
});
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar todos os usuários
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       401:
 *         description: Não autorizado
 */
router.get('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        console.log(' DEBUG - Rota de usuários acessada');
        console.log(' DEBUG - Usuário autenticado:', req.user);
        logger_1.default.info('Tentativa de listagem de usuários');
        // Temporariamente, apenas retorna uma mensagem de sucesso
        res.status(200).json({
            message: 'Rota de usuários acessada com sucesso',
            user: req.user
        });
    }
    catch (error) {
        console.error(' DEBUG - Erro na rota de usuários:', error);
        logger_1.default.error('Erro ao acessar rota de usuários', error);
        res.status(500).json({
            message: 'Erro ao acessar rota de usuários',
            error: error.message
        });
    }
});
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Criar novo usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - password
 *               - role
 *             properties:
 *               user_name:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        const { user_name, password, role } = req.body;
        const adminUser = req.user;
        // Validações de entrada
        if (!user_name || !password) {
            return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios' });
        }
        // Verificar se o usuário já existe
        const existingUser = await prisma.user.findUnique({ where: { user_name } });
        if (existingUser) {
            return res.status(400).json({ message: 'Nome de usuário já existe' });
        }
        // Hash da senha
        const hashedPassword = await argon2_1.default.hash(password);
        // Criar usuário
        const newUser = await prisma.user.create({
            data: {
                user_name,
                password: hashedPassword,
                role: role || 'user' // Padrão para 'user' se não especificado
            }
        });
        // Registrar log de ação
        await userActionLogService_1.default.logUserAction({
            actionType: 'CREATE',
            performedBy: adminUser.userId,
            targetUser: newUser.id,
            details: {
                user_name: newUser.user_name,
                role: newUser.role
            }
        });
        // Criar notificação de usuário criado
        await notificationService_1.default.createNotification({
            type: 'USER_CREATED',
            description: `Novo usuário criado: ${newUser.user_name}`,
            userId: adminUser.userId,
            metadata: {
                createdUserId: newUser.id,
                createdUserName: newUser.user_name,
                createdByUserId: adminUser.userId
            }
        });
        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: {
                id: newUser.id,
                user_name: newUser.user_name,
                role: newUser.role
            }
        });
    }
    catch (error) {
        console.error('Erro ao criar usuário', error);
        logger_1.default.error('Erro ao criar usuário', error);
        res.status(500).json({
            message: 'Erro ao criar usuário',
            error: error.message
        });
    }
});
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obter detalhes de um usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do usuário
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        console.log(' DEBUG - Rota de detalhes de usuário acessada');
        logger_1.default.info('Tentativa de buscar usuário');
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                user_name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            console.log(' DEBUG - Usuário não encontrado:', id);
            logger_1.default.warn(`Tentativa de buscar usuário inexistente: ${id}`);
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        logger_1.default.info(`Detalhes do usuário obtidos: ${id}`);
        res.status(200).json(user);
    }
    catch (error) {
        console.error(' DEBUG - Erro na rota de detalhes de usuário:', error);
        logger_1.default.error('Erro ao buscar usuário', error);
        res.status(500).json({
            message: 'Erro ao buscar usuário',
            error: error.message
        });
    }
});
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Excluir usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        console.log(' DEBUG - Rota de exclusão de usuário acessada');
        logger_1.default.info('Tentativa de excluir usuário');
        const { id } = req.params;
        const adminUserId = req.user.userId;
        // Verificar se o usuário existe
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            console.log(' DEBUG - Usuário não encontrado para exclusão:', id);
            logger_1.default.warn(`Tentativa de excluir usuário inexistente: ${id}`);
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        // Impedir exclusão do próprio usuário admin
        if (existingUser.user_name === 'admin') {
            console.log(' DEBUG - Tentativa de excluir usuário admin');
            logger_1.default.warn('Tentativa de excluir usuário admin bloqueada');
            return res.status(400).json({ message: 'Não é possível excluir o usuário admin principal' });
        }
        // Excluir usuário
        await prisma.user.delete({
            where: { id }
        });
        // Registrar log de exclusão de usuário
        await userActionLogService_1.default.logUserAction({
            actionType: client_1.UserActionType.DELETE,
            performedBy: adminUserId,
            targetUser: id,
            details: {
                user_name: existingUser.user_name,
                role: existingUser.role
            }
        });
        console.log(' DEBUG - Usuário excluído com sucesso:', id);
        logger_1.default.info(`Usuário excluído: ${id}`);
        res.status(200).json({
            message: 'Usuário excluído com sucesso',
            user: {
                id: existingUser.id,
                user_name: existingUser.user_name
            }
        });
    }
    catch (error) {
        console.error(' DEBUG - Erro na exclusão de usuário:', error);
        logger_1.default.error('Erro ao excluir usuário', error);
        res.status(500).json({
            message: 'Erro ao excluir usuário',
            error: error.message
        });
    }
});
// Rota para buscar logs de ações de usuário
router.get('/logs', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        // Log detalhado do usuário autenticado
        const user = req.user;
        console.log('DEBUG: Usuário autenticado', JSON.stringify(user, null, 2));
        logger_1.default.info('Buscando logs de usuário', { user });
        const { userId, actionType, startDate, endDate } = req.query;
        const filters = {};
        // Filtros opcionais
        if (userId)
            filters.userId = userId;
        if (actionType)
            filters.actionType = actionType;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        console.log('DEBUG: Filtros de logs', filters);
        const logs = await userActionLogService_1.default.getUserActionLogs(filters);
        console.log('DEBUG: Logs encontrados', logs);
        res.status(200).json({
            message: 'Logs de ações recuperados com sucesso',
            total: logs.length,
            logs
        });
    }
    catch (error) {
        console.error('DEBUG: Erro ao recuperar logs', error);
        logger_1.default.error('Erro ao recuperar logs de ações', error);
        res.status(500).json({
            message: 'Erro ao recuperar logs de ações',
            error: error.message
        });
    }
});
// Rota para buscar notificações de usuário
router.get('/notifications', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        console.log('DEBUG: Usuário buscando notificações', JSON.stringify(user, null, 2));
        logger_1.default.info('Buscando notificações de usuário', { user });
        const { type, isRead, startDate, endDate } = req.query;
        const filters = {};
        // Para usuários admin, permitir filtrar por qualquer usuário
        if (user.role === 'admin') {
            if (req.query.userId)
                filters.userId = req.query.userId;
        }
        else {
            // Usuários normais só podem ver suas próprias notificações
            filters.userId = user.userId;
        }
        if (type)
            filters.type = type;
        if (isRead !== undefined)
            filters.isRead = isRead === 'true';
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        console.log('DEBUG: Filtros de notificações', filters);
        const notifications = await notificationService_1.default.getNotifications(filters);
        console.log('DEBUG: Notificações encontradas', notifications);
        res.status(200).json({
            message: 'Notificações recuperadas com sucesso',
            total: notifications.length,
            notifications
        });
    }
    catch (error) {
        console.error('DEBUG: Erro ao recuperar notificações', error);
        logger_1.default.error('Erro ao recuperar notificações', error);
        res.status(500).json({
            message: 'Erro ao recuperar notificações',
            error: error.message
        });
    }
});
// Rota para marcar notificação como lida
router.patch('/notifications/:id/read', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const notificationId = req.params.id;
        console.log('DEBUG: Marcando notificação como lida', {
            userId: user.userId,
            notificationId
        });
        // Verificar se a notificação pertence ao usuário (para usuários não-admin)
        if (user.role !== 'admin') {
            const notification = await prisma.notification.findUnique({
                where: { id: notificationId }
            });
            if (!notification || notification.userId !== user.userId) {
                return res.status(403).json({
                    message: 'Não autorizado a marcar esta notificação como lida'
                });
            }
        }
        const updatedNotification = await notificationService_1.default.markNotificationAsRead(notificationId);
        res.status(200).json({
            message: 'Notificação marcada como lida',
            notification: updatedNotification
        });
    }
    catch (error) {
        console.error('DEBUG: Erro ao marcar notificação como lida', error);
        logger_1.default.error('Erro ao marcar notificação como lida', error);
        res.status(500).json({
            message: 'Erro ao marcar notificação como lida',
            error: error.message
        });
    }
});
// Rota para atualizar usuário
router.put('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { user_name, password, role } = req.body;
        const adminUser = req.user;
        // Verificar se o usuário existe
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        // Preparar dados para atualização
        const updateData = {};
        if (user_name)
            updateData.user_name = user_name;
        if (role)
            updateData.role = role;
        if (password) {
            updateData.password = await argon2_1.default.hash(password);
        }
        // Verificar se há mudanças de permissão
        const permissionChanged = role && role !== existingUser.role;
        // Atualizar usuário
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });
        // Registrar log de ação
        await userActionLogService_1.default.logUserAction({
            actionType: 'UPDATE',
            performedBy: adminUser.userId,
            targetUser: updatedUser.id,
            details: {
                updatedFields: Object.keys(updateData),
                previousRole: existingUser.role,
                newRole: updatedUser.role
            }
        });
        // Criar notificação de atualização de usuário
        await notificationService_1.default.createNotification({
            type: permissionChanged ? 'USER_PERMISSIONS_CHANGED' : 'USER_UPDATED',
            description: permissionChanged
                ? `Permissões do usuário ${updatedUser.user_name} alteradas`
                : `Usuário ${updatedUser.user_name} atualizado`,
            userId: adminUser.userId,
            metadata: {
                updatedUserId: updatedUser.id,
                updatedUserName: updatedUser.user_name,
                updatedByUserId: adminUser.userId,
                previousRole: existingUser.role,
                newRole: updatedUser.role
            }
        });
        res.status(200).json({
            message: 'Usuário atualizado com sucesso',
            user: {
                id: updatedUser.id,
                user_name: updatedUser.user_name,
                role: updatedUser.role
            }
        });
    }
    catch (error) {
        console.error('Erro ao atualizar usuário', error);
        logger_1.default.error('Erro ao atualizar usuário', error);
        res.status(500).json({
            message: 'Erro ao atualizar usuário',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map