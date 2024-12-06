const { PrismaClient, Prisma } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const IInstallmentRepository = require('../IInstallmentRepository');
const logger = require('../../../config/logger');

class PrismaInstallmentRepository extends IInstallmentRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient();
    }

    async findAll(filters = {}, skip = 0, take = 10) {
        const requestId = uuidv4();
        try {
            logger.info('Iniciando busca de parcelas', { 
                requestId,
                filters, 
                skip, 
                take 
            });

            const statusCondition = filters.status ? 
                Prisma.sql`AND i.status = '${Prisma.raw(filters.status)}'` : 
                Prisma.sql``;

            const searchCondition = filters.search ? 
                Prisma.sql`AND (LOWER(p.full_name) LIKE LOWER('%${Prisma.raw(filters.search)}%') OR LOWER(p.fantasy_name) LIKE LOWER('%${Prisma.raw(filters.search)}%'))` : 
                Prisma.sql``;

            const movementDateCondition = filters.movement_start_date && filters.movement_end_date ? 
                Prisma.sql`AND m.movement_date BETWEEN '${Prisma.raw(filters.movement_start_date)}' AND '${Prisma.raw(filters.movement_end_date)}'` : 
                Prisma.sql``;

            const dueDateCondition = filters.due_start_date && filters.due_end_date ? 
                Prisma.sql`AND i.due_date BETWEEN '${Prisma.raw(filters.due_start_date)}' AND '${Prisma.raw(filters.due_end_date)}'` : 
                Prisma.sql``;

            // Condição de data esperada
            const expectedDateCondition = filters.expected_start_date && filters.expected_end_date 
                ? Prisma.sql`AND i.expected_date >= '${Prisma.raw(filters.expected_start_date)}' AND i.expected_date <= '${Prisma.raw(filters.expected_end_date)}'` 
                : Prisma.sql``;

            logger.info('Search Debugging', { 
                requestId,
                search: filters.search,
                searchConditionRaw: searchCondition.sql,
                searchConditionType: typeof searchCondition,
                searchConditionValues: searchCondition.values
            });

            logger.info('Status Debugging', { 
                requestId,
                status: filters.status,
                statusConditionRaw: statusCondition.sql,
                statusConditionType: typeof statusCondition,
                statusConditionValues: statusCondition.values
            });

            logger.info('Date Debugging', { 
                requestId,
                movementDateCondition: movementDateCondition.sql,
                dueDateCondition: dueDateCondition.sql,
                expectedDateCondition: expectedDateCondition.sql,
                expectedStartDate: filters.expected_start_date,
                expectedEndDate: filters.expected_end_date,
                expectedDateConditionType: typeof expectedDateCondition,
                expectedDateConditionIsEmpty: expectedDateCondition.sql === '',
                filtersType: typeof filters,
                filtersExpectedStartDateType: typeof filters.expected_start_date,
                rawExpectedDateCondition: expectedDateCondition.toString(),
                expectedStartDateValue: filters.expected_start_date,
                expectedEndDateValue: filters.expected_end_date
            });

            // Log the exact query for debugging
            const totalQueryString = `
                SELECT COUNT(*) as total
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                WHERE m.movement_status_id = 23
                ${searchCondition.sql}
                ${statusCondition.sql}
                ${movementDateCondition.sql}
                ${dueDateCondition.sql}
                ${expectedDateCondition.sql}
            `;
            logger.info('Total Query String', { requestId, totalQueryString });
            logger.info('Query String', { requestId, searchCondition: searchCondition.sql });


            // Primeiro, vamos buscar o total de registros
            const totalQuery = await this.prisma.$queryRaw`
                SELECT COUNT(*) as total
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                WHERE m.movement_status_id = 23
                ${searchCondition}
                ${statusCondition}
                ${movementDateCondition}
                ${dueDateCondition}
                ${expectedDateCondition}
            `;
            const total = parseInt(totalQuery[0].total);

            // Agora buscamos os registros da página atual
            const queryString = `
                WITH ultimo_boleto AS (
                    SELECT 
                        b.installment_id,
                        b.boleto_url,
                        ROW_NUMBER() OVER (PARTITION BY b.installment_id ORDER BY b.last_status_update DESC) AS rn
                    FROM boletos b
                ),
                boleto_a_receber AS (
                    SELECT 
                        b.installment_id,
                        b.boleto_url
                    FROM boletos b
                    WHERE b.status = 'A_RECEBER'
                ),
                person_documents_json AS (
                    SELECT 
                        pd.person_id,
                        JSON_AGG(
                            JSON_BUILD_OBJECT(
                                'document_type', dt.description,
                                'document_value', pd.document_value
                            )
                        ) AS documents
                    FROM person_documents pd
                    JOIN document_types dt ON pd.document_type_id = dt.document_type_id
                    GROUP BY pd.person_id
                )
                SELECT 
                    m.movement_id,
                    m.movement_date,
                    m.movement_type_id,
                    i.installment_id,
                    i.due_date,
                    i.balance,
                    p.full_name,
                    p.fantasy_name,
                    i.installment_number,
                    i.amount,
                    i.status,
                    i.expected_date,
                    COALESCE(ua.boleto_url, u.boleto_url) AS boleto_url,
                    pdj.documents AS person_documents
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN ultimo_boleto u ON i.installment_id = u.installment_id AND u.rn = 1
                LEFT JOIN boleto_a_receber ua ON i.installment_id = ua.installment_id
                LEFT JOIN person_documents_json pdj ON p.person_id = pdj.person_id
                WHERE m.movement_status_id = 23
                ${searchCondition.sql}
                ${statusCondition.sql}
                ${movementDateCondition.sql}
                ${dueDateCondition.sql}
                ${expectedDateCondition.sql}
                ORDER BY i.due_date DESC
                LIMIT ${take} OFFSET ${skip}
            `;
            logger.info('Query String', { requestId, queryString });
            const response = await this.prisma.$queryRaw`
                WITH ultimo_boleto AS (
                    SELECT 
                        b.installment_id,
                        b.boleto_url,
                        ROW_NUMBER() OVER (PARTITION BY b.installment_id ORDER BY b.last_status_update DESC) AS rn
                    FROM boletos b
                ),
                boleto_a_receber AS (
                    SELECT 
                        b.installment_id,
                        b.boleto_url
                    FROM boletos b
                    WHERE b.status = 'A_RECEBER'
                ),
                person_documents_json AS (
                    SELECT 
                        pd.person_id,
                        JSON_AGG(
                            JSON_BUILD_OBJECT(
                                'document_type', dt.description,
                                'document_value', pd.document_value
                            )
                        ) AS documents
                    FROM person_documents pd
                    JOIN document_types dt ON pd.document_type_id = dt.document_type_id
                    GROUP BY pd.person_id
                )
                SELECT 
                    m.movement_id,
                    m.movement_date,
                    m.movement_type_id,
                    i.installment_id,
                    i.due_date,
                    i.balance,
                    p.full_name,
                    p.fantasy_name,
                    i.installment_number,
                    i.amount,
                    i.status,
                    i.expected_date,
                    COALESCE(ua.boleto_url, u.boleto_url) AS boleto_url,
                    pdj.documents AS person_documents
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN ultimo_boleto u ON i.installment_id = u.installment_id AND u.rn = 1
                LEFT JOIN boleto_a_receber ua ON i.installment_id = ua.installment_id
                LEFT JOIN person_documents_json pdj ON p.person_id = pdj.person_id
                WHERE m.movement_status_id = 23
                ${searchCondition}
                ${statusCondition}
                ${movementDateCondition}
                ${dueDateCondition}
                ${expectedDateCondition}
                ORDER BY i.due_date DESC
                LIMIT ${take} OFFSET ${skip}
            `;
            
            // Calcular metadados da paginação
            const totalPages = Math.ceil(total / take);
            const currentPage = Math.floor(skip / take) + 1;
            const hasNext = currentPage < totalPages;
            const hasPrevious = currentPage > 1;

            const result = {
                data: response,
                pagination: {
                    total,
                    totalPages,
                    currentPage,
                    perPage: take,
                    hasNext,
                    hasPrevious
                }
            };

            logger.info('Busca de parcelas concluída com sucesso', { 
                requestId,
                count: response.length,
                total,
                currentPage
            });

            return result;

        } catch (error) {
            logger.error('Erro ao buscar parcelas', { 
                requestId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = PrismaInstallmentRepository;
