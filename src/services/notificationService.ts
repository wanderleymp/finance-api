import { PrismaClient, NotificationType } from '@prisma/client';
import logger from '../config/logger';
import util from 'util';

const prisma = new PrismaClient();

export interface NotificationInput {
  type: NotificationType;
  description: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Cria uma nova notificação
   * @param notification Detalhes da notificação
   */
  static async createNotification(notification: NotificationInput) {
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
      logger.info('Nova notificação criada', {
        notificationId: newNotification.id,
        type: newNotification.type,
        userId: newNotification.userId
      });

      console.log('DEBUG: Notificação criada', util.inspect(newNotification, { depth: null }));

      return newNotification;
    } catch (error) {
      console.error('DEBUG: Erro ao criar notificação', error);
      logger.error('Erro ao criar notificação', {
        error: util.inspect(error, { depth: null }),
        notification
      });
      throw error;
    }
  }

  /**
   * Busca notificações com filtros opcionais
   * @param filters Filtros para busca de notificações
   */
  static async getNotifications(filters: {
    userId?: string;
    type?: NotificationType;
    isRead?: boolean;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    try {
      const where: any = {};

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

      logger.info('Notificações recuperadas', { 
        totalNotifications: notifications.length 
      });

      return notifications;
    } catch (error) {
      console.error('DEBUG: Erro ao buscar notificações', error);
      logger.error('Erro ao buscar notificações', {
        error: util.inspect(error, { depth: null }),
        filters
      });
      throw error;
    }
  }

  /**
   * Marca uma notificação como lida
   * @param notificationId ID da notificação
   */
  static async markNotificationAsRead(notificationId: string) {
    try {
      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      logger.info('Notificação marcada como lida', { 
        notificationId: updatedNotification.id 
      });

      return updatedNotification;
    } catch (error) {
      console.error('DEBUG: Erro ao marcar notificação como lida', error);
      logger.error('Erro ao marcar notificação como lida', {
        error: util.inspect(error, { depth: null }),
        notificationId
      });
      throw error;
    }
  }
}

export default NotificationService;
