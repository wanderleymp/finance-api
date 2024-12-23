const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');

class MovementRepository extends BaseRepository {
    constructor(personRepository, movementTypeRepository, movementStatusRepository) {
        super('movements', 'movement_id');
        if (!personRepository || !movementTypeRepository || !movementStatusRepository) {
            throw new Error('Repositórios são obrigatórios');
        }
        this.personRepository = personRepository;
        this.movementTypeRepository = movementTypeRepository;
        this.movementStatusRepository = movementStatusRepository;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            // Filtros básicos
            if (filters.status) {
                conditions.push(`m.status = $${paramCount}`);
                queryParams.push(filters.status);
                paramCount++;
            }

            if (filters.person_id) {
                conditions.push(`m.person_id = $${paramCount}`);
                queryParams.push(filters.person_id);
                paramCount++;
            }

            if (filters.start_date) {
                conditions.push(`m.movement_date >= $${paramCount}`);
                queryParams.push(filters.start_date);
                paramCount++;
            }

            if (filters.end_date) {
                conditions.push(`m.movement_date <= $${paramCount}`);
                queryParams.push(filters.end_date);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            const offset = (page - 1) * limit;

            // Query base
            let query = `
                SELECT m.*
                FROM movements m
                ${whereClause}
                ORDER BY m.movement_date DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM movements m
                ${whereClause}
            `;

            // Adiciona parâmetros de paginação
            queryParams.push(limit, offset);

            // Executa as queries
            const [resultQuery, countResult] = await Promise.all([
                this.pool.query(query, queryParams),
                this.pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            // Busca dados relacionados
            let movements = await Promise.all(resultQuery.rows.map(async (movement) => {
                // Busca pessoa
                const person = await this.personRepository.findById(movement.person_id);
                if (person) {
                    movement.person_name = person.person_name;
                    movement.person_document = person.document;
                }

                // Busca tipo de movimento
                const movementType = await this.movementTypeRepository.findById(movement.movement_type_id);
                if (movementType) {
                    movement.type_name = movementType.type_name;
                }

                // Busca status do movimento
                const movementStatus = await this.movementStatusRepository.findById(movement.movement_status_id);
                if (movementStatus) {
                    movement.status_name = movementStatus.status_name;
                }

                return movement;
            }));

            // Se include=payments, busca os pagamentos
            if (filters.include?.startsWith('payments')) {
                const movementIds = movements.map(row => row.movement_id);
                
                if (movementIds.length > 0) {
                    const paymentsQuery = `
                        SELECT 
                            pay.*
                        FROM movement_payments pay
                        WHERE pay.movement_id = ANY($1)
                        ORDER BY pay.created_at DESC
                    `;

                    const paymentsResult = await this.pool.query(paymentsQuery, [movementIds]);
                    
                    // Se include=payments.installments, busca as parcelas
                    if (filters.include.includes('installments')) {
                        const paymentIds = paymentsResult.rows.map(row => row.payment_id);
                        
                        if (paymentIds.length > 0) {
                            const installmentsQuery = `
                                SELECT 
                                    i.*
                                FROM installments i
                                WHERE i.payment_id = ANY($1)
                                ORDER BY i.due_date ASC
                            `;

                            const installmentsResult = await this.pool.query(installmentsQuery, [paymentIds]);
                            
                            // Se include=payments.installments.boletos, busca os boletos
                            if (filters.include.includes('boletos')) {
                                const installmentIds = installmentsResult.rows.map(row => row.installment_id);
                                
                                if (installmentIds.length > 0) {
                                    const boletosQuery = `
                                        SELECT 
                                            b.boleto_id,
                                            b.installment_id,
                                            b.status,
                                            b.generated_at,
                                            b.boleto_number
                                        FROM boletos b
                                        WHERE b.installment_id = ANY($1)
                                        ORDER BY b.generated_at DESC
                                    `;

                                    const boletosResult = await this.pool.query(boletosQuery, [installmentIds]);
                                    
                                    // Agrupa os boletos por installment_id
                                    const boletosMap = boletosResult.rows.reduce((acc, boleto) => {
                                        if (!acc[boleto.installment_id]) {
                                            acc[boleto.installment_id] = [];
                                        }
                                        acc[boleto.installment_id].push(boleto);
                                        return acc;
                                    }, {});

                                    // Adiciona os boletos às parcelas
                                    installmentsResult.rows = installmentsResult.rows.map(installment => ({
                                        ...installment,
                                        boletos: boletosMap[installment.installment_id] || []
                                    }));
                                }
                            }

                            // Agrupa as parcelas por payment_id
                            const installmentsMap = installmentsResult.rows.reduce((acc, installment) => {
                                if (!acc[installment.payment_id]) {
                                    acc[installment.payment_id] = [];
                                }
                                acc[installment.payment_id].push(installment);
                                return acc;
                            }, {});

                            // Adiciona as parcelas aos pagamentos
                            paymentsResult.rows = paymentsResult.rows.map(payment => ({
                                ...payment,
                                installments: installmentsMap[payment.payment_id] || []
                            }));
                        }
                    }

                    // Agrupa os pagamentos por movement_id
                    const paymentsMap = paymentsResult.rows.reduce((acc, payment) => {
                        if (!acc[payment.movement_id]) {
                            acc[payment.movement_id] = [];
                        }
                        acc[payment.movement_id].push(payment);
                        return acc;
                    }, {});

                    // Adiciona os pagamentos aos movimentos
                    movements = movements.map(movement => ({
                        ...movement,
                        payments: paymentsMap[movement.movement_id] || []
                    }));
                }
            }

            return {
                data: movements,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar movimentos', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw new DatabaseError('Erro ao buscar movimentos');
        }
    }

    async findById(id) {
        try {
            const query = `
                SELECT 
                    m.*
                FROM movements m
                WHERE m.movement_id = $1
            `;

            const { rows } = await this.pool.query(query, [id]);
            const movement = rows[0];

            if (movement) {
                // Busca pessoa
                const person = await this.personRepository.findById(movement.person_id);
                if (person) {
                    movement.person_name = person.person_name;
                    movement.person_document = person.document;
                }

                // Busca tipo de movimento
                const movementType = await this.movementTypeRepository.findById(movement.movement_type_id);
                if (movementType) {
                    movement.type_name = movementType.type_name;
                }

                // Busca status do movimento
                const movementStatus = await this.movementStatusRepository.findById(movement.movement_status_id);
                if (movementStatus) {
                    movement.status_name = movementStatus.status_name;
                }
            }

            return movement;
        } catch (error) {
            logger.error('Erro ao buscar registro por ID', {
                error: error.message,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }
}

module.exports = MovementRepository;
