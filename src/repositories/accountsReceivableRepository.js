const { PrismaClient, Prisma } = require('@prisma/client');
const logger = require('../../config/logger');

// Singleton para garantir uma única instância do Prisma
let prisma;

function getPrismaClient() {
    if (!prisma) {
        try {
            prisma = new PrismaClient({
                log: ['query', 'info', 'warn', 'error']
            });
        } catch (error) {
            logger.error('Erro ao inicializar Prisma Client', { error: error.message });
            throw error;
        }
    }
    return prisma;
}

exports.getAccountsReceivable = async (filters, options) => {
    try {
        const prismaClient = getPrismaClient();

        const {
            movement_status_id,
            person_id,
            due_date_start,
            due_date_end,
            expected_date_start,
            expected_date_end,
            days_overdue,
            movement_type_id
        } = filters;

        const {
            order_by = 'due_date',
            order = 'desc',
            page = 1,
            limit = 10
        } = options;

        logger.info('Accounts Receivable Query Params', { 
            filters, 
            options 
        });

        const skip = (page - 1) * limit;

        const where = [];
        const params = [];

        // Adicionar filtros apenas se não forem nulos
        if (movement_status_id !== null) {
            where.push('m.movement_status_id = $' + (params.length + 1));
            params.push(movement_status_id);
        }

        if (person_id !== null) {
            where.push('p.person_id = $' + (params.length + 1));
            params.push(person_id);
        }

        if (due_date_start) {
            where.push('i.due_date >= $' + (params.length + 1));
            params.push(new Date(due_date_start));
        }

        if (due_date_end) {
            where.push('i.due_date <= $' + (params.length + 1));
            params.push(new Date(due_date_end));
        }

        if (expected_date_start) {
            where.push('i.expected_date >= $' + (params.length + 1));
            params.push(new Date(expected_date_start));
        }

        if (expected_date_end) {
            where.push('i.expected_date <= $' + (params.length + 1));
            params.push(new Date(expected_date_end));
        }

        if (days_overdue !== null) {
            where.push('EXTRACT(DAY FROM NOW() - i.due_date) >= $' + (params.length + 1));
            params.push(days_overdue);
        }

        if (movement_type_id !== null) {
            where.push('m.movement_type_id = $' + (params.length + 1));
            params.push(movement_type_id);
        }

        const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
        logger.info('Accounts Receivable Where Clause', { whereClause });

        const countQuery = `
            SELECT COUNT(*) as total
            FROM installments i
            JOIN movement_payments mp ON mp.payment_id = i.payment_id
            JOIN movements m ON m.movement_id = mp.movement_id
            LEFT JOIN persons p ON p.person_id = m.person_id
            LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
            ${whereClause}
        `;

        const total = await prismaClient.$queryRawUnsafe(countQuery, ...params);
        const totalCount = Number(total[0]?.total) || 0;
        logger.info('Accounts Receivable Total Count', { total: totalCount });

        const selectQuery = `
            SELECT 
                i.installment_id,
                mp.movement_id,
                i.payment_id,
                i.installment_number,
                i.due_date,
                i.expected_date,
                EXTRACT(DAY FROM NOW() - i.due_date)::integer as days_overdue,
                i.amount as value,
                i.status,
                p.person_id,
                p.full_name,
                m.movement_type_id,
                ms.status_name as movement_status
            FROM installments i
            JOIN movement_payments mp ON mp.payment_id = i.payment_id
            JOIN movements m ON m.movement_id = mp.movement_id
            LEFT JOIN persons p ON p.person_id = m.person_id
            LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
            ${whereClause}
            ORDER BY i.${order_by} ${order}
            LIMIT ${limit} OFFSET ${skip}
        `;

        const accountsReceivable = await prismaClient.$queryRawUnsafe(selectQuery, ...params);

        const totalPages = Math.ceil(totalCount / limit);
        const currentPage = page;
        const hasNext = currentPage < totalPages;
        const hasPrevious = currentPage > 1;

        return {
            data: accountsReceivable,
            pagination: {
                total: totalCount,
                totalPages,
                currentPage,
                perPage: limit,
                hasNext,
                hasPrevious
            }
        };
    } catch (error) {
        logger.error('Error in getAccountsReceivable', { 
            error: error.message, 
            stack: error.stack 
        });
        throw error;
    }
};
