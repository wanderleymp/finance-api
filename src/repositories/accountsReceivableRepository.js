const { PrismaClient, Prisma } = require('@prisma/client');
const logger = require('../../config/logger');
const fs = require('fs');
const path = require('path');

// Função de log para salvar em arquivo
function debugLog(message) {
    try {
        const logPath = path.join(__dirname, '..', '..', 'debug_accounts_receivable.log');
        fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
    } catch (error) {
        // Silently fail if unable to log
    }
}

// Singleton para garantir uma única instância do Prisma
let prisma;

function getPrismaClient() {
    if (!prisma) {
        try {
            prisma = new PrismaClient({
                log: [] // Remove todos os logs
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
            expectedDateStart,  
            expectedDateEnd,    
            days_overdue, 
            movement_type_id,
            search,
            status
        } = filters;

        const {
            order_by = 'due_date',
            order = 'desc',
            page = 1,
            limit = 10
        } = options;

        debugLog(`Received Parameters: ${JSON.stringify({ filters, options })}`);

        logger.info('Accounts Receivable Query Params FULL DEBUG', { 
            filters, 
            options,
            allFiltersKeys: Object.keys(filters),
            searchValue: filters.search,
            searchType: typeof filters.search,
            statusValue: filters.status,
            statusType: typeof filters.status,
            fullFiltersObject: JSON.stringify(filters, null, 2)
        });

        const skip = (page - 1) * limit;

        const whereConditions = [];
        const whereParams = [];

        if (movement_status_id) {
            whereConditions.push('m.movement_status_id = $' + (whereParams.length + 1));
            whereParams.push(movement_status_id);
        }

        if (person_id) {
            whereConditions.push('m.person_id = $' + (whereParams.length + 1));
            whereParams.push(person_id);
        }

        if (due_date_start) {
            whereConditions.push('i.due_date >= $' + (whereParams.length + 1)+'::date');
            whereParams.push(due_date_start);
        }

        if (due_date_end) {
            whereConditions.push('i.due_date <= $' + (whereParams.length + 1)+'::date');
            whereParams.push(due_date_end);
        }

        if (expectedDateStart) {  
            const formattedStartDate = new Date(expectedDateStart).toISOString().split('T')[0];
            whereConditions.push('i.expected_date >= $' + (whereParams.length + 1)+'::date');
            whereParams.push(formattedStartDate);
        }

        if (expectedDateEnd) {  
            const formattedEndDate = new Date(expectedDateEnd).toISOString().split('T')[0];
            whereConditions.push('i.expected_date <= $' + (whereParams.length + 1)+'::date');
            whereParams.push(formattedEndDate);
        }

        if (days_overdue !== null && days_overdue !== undefined) {
            whereConditions.push('EXTRACT(DAY FROM NOW() - i.due_date)::integer = $' + (whereParams.length + 1));
            whereParams.push(days_overdue);
        }

        if (movement_type_id) {
            whereConditions.push('m.movement_type_id = $' + (whereParams.length + 1));
            whereParams.push(movement_type_id);
        }

        if (search) {
            logger.debug('DEBUG: Search parameter received', { 
                search, 
                fullNameSearch: '%' + search + '%'
            });
            whereConditions.push('LOWER(p.full_name) ILIKE $' + (whereParams.length + 1));
            whereParams.push('%' + search.toLowerCase() + '%');
        }

        if (status) {
            logger.debug('DEBUG: Status parameter received', { 
                status, 
                statusType: typeof status,
                statusRawValue: status,
                statusTrimmed: status.trim(),
                statusLength: status.length
            });
            
            // Adiciona condição de status com cast explícito e comparação case-sensitive
            whereConditions.push('i.status = $' + (whereParams.length + 1) + '::text');
            whereParams.push(status.trim());
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        debugLog('DEBUG - Where Clause: ' + whereClause);
        debugLog('DEBUG - Where Conditions: ' + JSON.stringify(whereConditions));
        debugLog('DEBUG - Where Params: ' + JSON.stringify(whereParams));

        const countQuery = `
            SELECT COUNT(*) as total
            FROM installments i
            JOIN movement_payments mp ON mp.payment_id = i.payment_id
            JOIN movements m ON m.movement_id = mp.movement_id
            LEFT JOIN persons p ON p.person_id = m.person_id
            LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
            INNER JOIN movement_types mt ON mt.movement_type_id = m.movement_type_id
            LEFT JOIN (
                SELECT 
                    b.installment_id, 
                    b.boleto_url, 
                    b.status AS boleto_status
                FROM (
                    SELECT 
                        installment_id, 
                        MAX(generated_at) AS max_generated_at
                    FROM boletos
                    GROUP BY installment_id
                ) latest_boleto
                JOIN boletos b ON b.installment_id = latest_boleto.installment_id 
                    AND b.generated_at = latest_boleto.max_generated_at
            ) b ON b.installment_id = i.installment_id
            ${whereClause}
        `;

        debugLog('DEBUG - Full Count Query: ' + countQuery);

        const total = await prismaClient.$queryRawUnsafe(countQuery, ...whereParams);
        const totalCount = Number(total[0]?.total) || 0;

        debugLog('DEBUG - Total Count: ' + totalCount);

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
                mt.type_name,
                ms.status_name as movement_status,
                b.boleto_url,
                b.boleto_status
            FROM installments i
            JOIN movement_payments mp ON mp.payment_id = i.payment_id
            JOIN movements m ON m.movement_id = mp.movement_id
            LEFT JOIN persons p ON p.person_id = m.person_id
            LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
            INNER JOIN movement_types mt ON mt.movement_type_id = m.movement_type_id
            LEFT JOIN (
                SELECT 
                    b.installment_id, 
                    b.boleto_url, 
                    b.status AS boleto_status
                FROM (
                    SELECT 
                        installment_id, 
                        MAX(generated_at) AS max_generated_at
                    FROM boletos
                    GROUP BY installment_id
                ) latest_boleto
                JOIN boletos b ON b.installment_id = latest_boleto.installment_id 
                    AND b.generated_at = latest_boleto.max_generated_at
            ) b ON b.installment_id = i.installment_id
            ${whereClause}
            ORDER BY ${order_by} ${order}
            LIMIT ${limit}
            OFFSET ${skip}
        `;

        console.log('DEBUG - Full Query:', selectQuery);
        console.log('DEBUG - Query Params:', whereParams);
        console.log('DEBUG - Where Clause:', whereClause);

        const accountsReceivable = await prismaClient.$queryRawUnsafe(selectQuery, ...whereParams);

        debugLog('DEBUG - Accounts Receivable Count: ' + accountsReceivable.length);

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
