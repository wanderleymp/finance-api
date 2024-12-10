"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../config/logger"));
const util_1 = __importDefault(require("util"));
const prisma = new client_1.PrismaClient();
class NotificationService {
    /**
     * Cria uma nova notificação
     * @param notification Detalhes da notificação
     */
    static async createNotification(notification) {
        try {
            // Verificar se o usuário existe, se um ID de usuário for fornecido
            if (notification.userId) {
                const userExists = await prisma.user.findUnique({
                    where: { id: notification.userId }
                });
                if (!userExists) {
                    throw new Error(`Usuário com ID ${notification.userId} não encontrado`);
                }
            }
            // Criar notificação
            const newNotification = await prisma.notification.create({
                data: {
                    type: notification.type,
                    description: notification.description,
                    userId: notification.userId,
                    metadata: notification.metadata
                        ? JSON.parse(JSON.stringify(notification.metadata))
                        : undefined
                }
            });
            // Log da notificação criada
            logger_1.default.info('Nova notificação criada', {
                notificationId: newNotification.id,
                type: newNotification.type,
                userId: newNotification.userId
            });
            console.log('DEBUG: Notificação criada', util_1.default.inspect(newNotification, { depth: null }));
            return newNotification;
        }
        catch (error) {
            console.error('DEBUG: Erro ao criar notificação', error);
            logger_1.default.error('Erro ao criar notificação', {
                error: util_1.default.inspect(error, { depth: null }),
                notification
            });
            throw error;
        }
    }
    /**
     * Busca notificações com filtros opcionais
     * @param filters Filtros para busca de notificações
     */
    static async getNotifications(filters = {}) {
        try {
            const where = {};
            // Filtros opcionais
            if (filters.userId) {
                where.userId = filters.userId;
            }
            if (filters.type) {
                where.type = filters.type;
            }
            if (filters.isRead !== undefined) {
                where.isRead = filters.isRead;
            }
            if (filters.startDate) {
                where.createdAt = { gte: filters.startDate };
            }
            if (filters.endDate) {
                where.createdAt = {
                    ...(where.createdAt || {}),
                    lte: filters.endDate
                };
            }
            const notifications = await prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, user_name: true } }
                },
                // Limitar para evitar sobrecarga
                take: 100
            });
            logger_1.default.info('Notificações recuperadas', {
                totalNotifications: notifications.length
            });
            return notifications;
        }
        catch (error) {
            console.error('DEBUG: Erro ao buscar notificações', error);
            logger_1.default.error('Erro ao buscar notificações', {
                error: util_1.default.inspect(error, { depth: null }),
                filters
            });
            throw error;
        }
    }
    /**
     * Marca uma notificação como lida
     * @param notificationId ID da notificação
     */
    static async markNotificationAsRead(notificationId) {
        try {
            const updatedNotification = await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            });
            logger_1.default.info('Notificação marcada como lida', {
                notificationId: updatedNotification.id
            });
            return updatedNotification;
        }
        catch (error) {
            console.error('DEBUG: Erro ao marcar notificação como lida', error);
            logger_1.default.error('Erro ao marcar notificação como lida', {
                error: util_1.default.inspect(error, { depth: null }),
                notificationId
            });
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
//# sourceMappingURL=notificationService.js.map