"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActionLogService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../config/logger"));
const util_1 = __importDefault(require("util"));
const prisma = new client_1.PrismaClient();
class UserActionLogService {
    /**
     * Registra uma ação de usuário no banco de dados
     * @param actionLog Detalhes da ação de usuário
     */
    static async logUserAction(actionLog) {
        try {
            console.log('DEBUG: Iniciando registro de log de ação', util_1.default.inspect(actionLog, { depth: null }));
            // Verificar se os usuários existem antes de criar o log
            const [performerExists, targetExists] = await Promise.all([
                prisma.user.findUnique({ where: { id: actionLog.performedBy } }),
                prisma.user.findUnique({ where: { id: actionLog.targetUser } })
            ]);
            if (!performerExists || !targetExists) {
                throw new Error('Usuário não encontrado');
            }
            const log = await prisma.userActionLog.create({
                data: {
                    actionType: actionLog.actionType,
                    performedBy: actionLog.performedBy,
                    targetUser: actionLog.targetUser,
                    details: actionLog.details ? JSON.parse(JSON.stringify(actionLog.details)) : undefined
                }
            });
            console.log('DEBUG: Log de ação registrado com sucesso', util_1.default.inspect(log, { depth: null }));
            // Log adicional para rastreamento
            logger_1.default.info(`Ação de usuário registrada: ${actionLog.actionType}`, {
                performedBy: actionLog.performedBy,
                targetUser: actionLog.targetUser,
                logId: log.id
            });
            return log;
        }
        catch (error) {
            console.error('DEBUG: Erro crítico ao registrar log de ação', error);
            logger_1.default.error('Erro ao registrar log de ação de usuário', {
                error: util_1.default.inspect(error, { depth: null }),
                actionLog
            });
            throw error;
        }
    }
    /**
     * Busca logs de ações de usuário
     * @param filters Filtros para busca de logs
     */
    static async getUserActionLogs(filters = {}) {
        try {
            console.log('DEBUG: Buscando logs de ação', util_1.default.inspect(filters, { depth: null }));
            logger_1.default.info('Iniciando busca de logs de usuário', { filters });
            // Log adicional para verificar o ambiente
            console.log('DEBUG: Ambiente Prisma', {
                provider: typeof prisma.$connect === 'function' ? 'Connectable' : 'Not Connectable',
                environment: process.env.NODE_ENV
            });
            const where = {};
            // Filtros opcionais
            if (filters.userId) {
                where.OR = [
                    { performedBy: filters.userId },
                    { targetUser: filters.userId }
                ];
            }
            if (filters.actionType) {
                where.actionType = filters.actionType;
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
            console.log('DEBUG: Filtros de busca de logs', util_1.default.inspect(where, { depth: null }));
            logger_1.default.info('Filtros de busca de logs', { where });
            const logs = await prisma.userActionLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    performer: { select: { id: true, user_name: true } },
                    user: { select: { id: true, user_name: true } }
                },
                // Limitar para evitar sobrecarga
                take: 100
            });
            console.log('DEBUG: Logs encontrados', util_1.default.inspect(logs, { depth: null }));
            logger_1.default.info('Logs de usuário recuperados', {
                totalLogs: logs.length,
                firstLog: logs[0]
            });
            return logs;
        }
        catch (error) {
            console.error('DEBUG: Erro crítico ao buscar logs de ação', error);
            logger_1.default.error('Erro ao buscar logs de ações de usuário', {
                error: util_1.default.inspect(error, { depth: null }),
                filters
            });
            throw error;
        }
    }
}
exports.UserActionLogService = UserActionLogService;
exports.default = UserActionLogService;
//# sourceMappingURL=userActionLogService.js.map