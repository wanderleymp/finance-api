const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const CreateInstallmentDTO = require('./dto/create-installment.dto');
const UpdateInstallmentDTO = require('./dto/update-installment.dto');
const InstallmentResponseDTO = require('./dto/installment-response.dto');
const moment = require('moment-timezone');
const InstallmentRepository = require('./installment.repository');

class InstallmentService {
    constructor({ 
        installmentRepository = new InstallmentRepository(), 
        boletoService,
        boletoRepository,
        n8nService
    } = {}) {
        this.repository = installmentRepository;
        this.boletoService = boletoService;
        this.boletoRepository = boletoRepository;
        this.n8nService = n8nService;
        this.pool = this.repository.pool;
    }

    async listInstallments(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando parcelas', { page, limit, filters });
            
            const result = await this.repository.findAll(page, limit, filters);
            
            // Verifica se há itens antes de mapear
            if (!result.data || result.data.length === 0) {
                logger.info('Nenhuma parcela encontrada', { page, limit, filters });
                return {
                    items: [],
                    meta: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0
                    }
                };
            }

            // Mapear resultado para DTO
            const mappedResult = {
                items: result.data.map(item => new InstallmentResponseDTO(item)),
                meta: {
                    total: result.total,
                    page,
                    limit,
                    totalPages: Math.ceil(result.total / limit)
                }
            };

            return mappedResult;
        } catch (error) {
            logger.error('Erro ao listar parcelas', { 
                error: error.message, 
                stack: error.stack,
                page, 
                limit, 
                filters 
            });
            throw new ValidationError('LIST_INSTALLMENTS_ERROR', 'Erro ao listar parcelas');
        }
    }

    async getInstallmentById(id) {
        try {
            logger.info('Serviço: Buscando parcela por ID', { id });
            
            const installment = await this.repository.findInstallmentWithDetails(id);
            
            if (!installment) {
                throw new ValidationError('Parcela não encontrada');
            }

            const installmentResponse = new InstallmentResponseDTO(installment);
            
            return installmentResponse;
        } catch (error) {
            logger.error('Erro ao buscar parcela por ID', { error, id });
            throw error;
        }
    }

    async getInstallmentDetails(id) {
        try {
            logger.info('Serviço: Buscando detalhes da parcela', { id });
            
            const installment = await this.repository.findInstallmentWithDetails(id);
            
            if (!installment) {
                throw new ValidationError('Parcela não encontrada');
            }

            const installmentResponse = new InstallmentResponseDTO(installment);
            
            return installmentResponse;
        } catch (error) {
            logger.error('Erro ao buscar detalhes da parcela', { error, id });
            throw error;
        }
    }

    async createInstallment(data, client = null) {
        try {
            // Se não tiver cliente de transação, criar um novo
            const shouldManageTransaction = !client;
            const transactionClient = client || await this.repository.pool.connect();

            try {
                if (shouldManageTransaction) {
                    await transactionClient.query('BEGIN');
                }

                // Criar DTO e validar
                const dto = new CreateInstallmentDTO(data);
                dto.validate();

                // Criar parcela
                const installment = await this.repository.createWithClient(transactionClient, {
                    payment_id: dto.payment_id,
                    installment_number: dto.installment_number,
                    due_date: dto.due_date,
                    amount: dto.amount,
                    balance: dto.balance,
                    status: dto.status,
                    account_entry_id: dto.account_entry_id
                });

                if (shouldManageTransaction) {
                    await transactionClient.query('COMMIT');
                }

                return new InstallmentResponseDTO(installment);
            } catch (error) {
                if (shouldManageTransaction) {
                    await transactionClient.query('ROLLBACK');
                }
                throw error;
            } finally {
                if (shouldManageTransaction && transactionClient) {
                    transactionClient.release();
                }
            }
        } catch (error) {
            logger.error('Erro ao criar parcela', { error });
            throw error;
        }
    }

    async createInstallmentWithTransaction(client, data) {
        try {
            const dto = new CreateInstallmentDTO(data);
            dto.validate();

            const installment = await this.repository.createWithClient(client, {
                payment_id: dto.payment_id,
                installment_number: dto.installment_number,
                due_date: dto.due_date,
                amount: dto.amount,
                balance: dto.balance,
                status: dto.status,
                account_entry_id: dto.account_entry_id
            });

            return installment;
        } catch (error) {
            logger.error('Erro ao criar parcela', { error });
            throw error;
        }
    }

    async updateInstallment(id, data) {
        const client = await this.repository.pool.connect();
        try {
            await client.query('BEGIN');

            // Criar DTO e validar
            const dto = new UpdateInstallmentDTO(data);
            dto.validate();

            // Atualizar parcela
            const updatedInstallment = await this.repository.updateWithClient(client, id, {
                due_date: dto.due_date,
                amount: dto.amount
            });

            await client.query('COMMIT');

            return new InstallmentResponseDTO(updatedInstallment);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao atualizar parcela', { error, id, data });
            throw error;
        } finally {
            client.release();
        }
    }

    async updateInstallmentDueDate(id, dueDate, amount) {
        const client = await this.repository.pool.connect();
        try {
            await client.query('BEGIN');

            // Verificar se parcela existe
            const existing = await this.repository.findById(id);
            if (!existing) {
                throw new ValidationError('Parcela não encontrada');
            }

            // Criar DTO para validar dados
            const updateData = {
                due_date: dueDate,
                amount: amount
            };
            const dto = new UpdateInstallmentDTO(updateData);
            dto.validate();

            logger.info('Dados para atualização', { 
                updateData: {
                    due_date: dto.due_date,
                    amount: dto.amount
                }
            });

            // Atualizar parcela diretamente
            const updated = await this.repository.update(id, {
                due_date: dto.due_date,
                amount: parseFloat(dto.amount)
            });

            await client.query('COMMIT');

            return new InstallmentResponseDTO(updated);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao atualizar vencimento da parcela', { 
                error: error.message, 
                id, 
                dueDate, 
                amount,
                stack: error.stack 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async registerInstallmentPayment(id, paymentData) {
        const client = await this.repository.pool.connect();
        try {
            await client.query('BEGIN');

            // Valores padrão
            const paymentDetails = {
                installment_id: id,
                valor_pago: paymentData.value,
                bank_id: paymentData.bank_id || 2,
                juros: paymentData.juros || 0,
                descontos: paymentData.descontos || 0,
                payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0]
            };

            logger.info('Registrando pagamento de parcela via função do banco de dados', { paymentDetails });

            // Chama a função do banco de dados para registrar o pagamento
            const result = await client.query(
                `SELECT fn_installment_receive_payment(
                    $1, $2, $3, $4, $5, $6::DATE
                )`,
                [
                    paymentDetails.installment_id, 
                    paymentDetails.valor_pago, 
                    paymentDetails.bank_id, 
                    paymentDetails.juros, 
                    paymentDetails.descontos, 
                    paymentDetails.payment_date
                ]
            );

            await client.query('COMMIT');

            // Busca os detalhes atualizados da parcela
            const updatedInstallment = await this.repository.findInstallmentWithDetails(id);

            // Chamada assíncrona para cancelar boleto
            this.cancelInstallmentBoletoAsync(id)
                .catch(error => {
                    logger.error('Erro ao cancelar boleto de forma assíncrona', {
                        installmentId: id,
                        errorMessage: error.message
                    });
                });

            return new InstallmentResponseDTO(updatedInstallment);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao registrar pagamento da parcela', { 
                error: error.message, 
                id, 
                paymentData,
                stack: error.stack 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async cancelInstallmentBoletoAsync(installmentId) {
        try {
            logger.info('Iniciando cancelamento de boleto de forma assíncrona', { installmentId });

            const canceledBoletos = await this.cancelInstallmentBoletos(installmentId);

            if (canceledBoletos.length > 0) {
                logger.info('Boleto cancelado com sucesso de forma assíncrona', { 
                    installmentId, 
                    canceledBoletosCount: canceledBoletos.length 
                });
            }
        } catch (error) {
            logger.error('Erro no cancelamento assíncrono de boleto', {
                installmentId,
                errorMessage: error.message,
                errorStack: error.stack
            });
            // Não relança o erro para não afetar o fluxo principal de pagamento
        }
    }

    async generateBoleto(installmentId) {
        try {
            logger.info('Service: Gerando boleto para parcela', { installmentId });

            // 1. Buscar parcela
            const installment = await this.repository.findById(installmentId);
            if (!installment) {
                throw new ValidationError('Parcela não encontrada');
            }

            // 2. Buscar dados do movimento/pagamento
            const payment = await this.repository.findPaymentByInstallmentId(installmentId);
            if (!payment) {
                throw new ValidationError('Pagamento não encontrado');
            }

            // 3. Gerar boleto
            const boletoData = {
                installment_id: installmentId,
                due_date: installment.due_date,
                amount: installment.amount,
                payer_id: payment.person_id,
                description: payment.description,
                status: 'A_EMITIR'
            };

            logger.info('Service: Criando boleto', { boletoData });

            const boleto = await this.boletoService.createBoleto(boletoData);

            return boleto;
        } catch (error) {
            logger.error('Service: Erro ao gerar boleto', {
                error: error.message,
                error_stack: error.stack,
                installmentId
            });
            throw error;
        }
    }

    async cancelInstallmentBoletos(installmentId) {
        try {
            logger.info('Serviço: Cancelando boletos da parcela', { installmentId });

            // Verifica se o repositório existe
            if (!this.repository || typeof this.repository.findInstallmentWithDetails !== 'function') {
                logger.warn('Repositório não configurado corretamente', { installmentId });
                return [];
            }

            // Busca detalhes da parcela com boletos
            const installmentDetails = await this.repository.findInstallmentWithDetails(installmentId);
            
            if (!installmentDetails) {
                logger.warn('Parcela não encontrada para cancelamento', { installmentId });
                return [];
            }

            // Verifica se há boleto para cancelar
            if (!installmentDetails.boleto_id) {
                logger.info('Nenhum boleto encontrado para cancelamento', { installmentId });
                return [];
            }

            const canceledBoletos = [];

            try {
                // Recupera external_boleto_id
                const boletoDetails = await this.boletoService.findById(installmentDetails.boleto_id);
                
                // Extrair external_boleto_id de diferentes formatos
                const externalBoletoId = 
                    boletoDetails.external_boleto_id || 
                    boletoDetails.external_data?.boleto_id || 
                    boletoDetails.external_data;
                
                if (!externalBoletoId) {
                    logger.warn('Boleto sem external_boleto_id', { 
                        boletoId: installmentDetails.boleto_id,
                        boletoDetails 
                    });
                    return [];
                }

                // Chama serviço do N8N para cancelamento
                const n8nResponse = await this.n8nService.cancelBoleto({
                    external_boleto_id: externalBoletoId
                });

                // Verifica se o cancelamento foi bem-sucedido
                if (n8nResponse && Object.keys(n8nResponse).length > 0) {
                    canceledBoletos.push(installmentDetails.boleto_id);
                }

            } catch (boletoError) {
                logger.error('Erro ao cancelar boleto individual', {
                    installmentId,
                    boletoId: installmentDetails.boleto_id,
                    error: boletoError.message
                });
                throw boletoError;
            }

            return canceledBoletos;
        } catch (error) {
            logger.error('Erro ao cancelar boletos da parcela', {
                installmentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Busca detalhes de parcelas com filtros
     * @param {number} page Página atual
     * @param {number} limit Limite de itens por página
     * @param {Object} filters Filtros de busca
     * @returns {Promise<Object>} Detalhes das parcelas
     */
    async findInstallmentsDetails(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Service: Buscando detalhes de parcelas', { 
                page, 
                limit, 
                filters 
            });

            // Definir colunas de ordenação válidas
            const validSortColumns = [
                'due_date', 
                'amount', 
                'installment_number', 
                'status', 
                'full_name'
            ];

            // Validar e definir coluna de ordenação
            const sort = filters.sort && validSortColumns.includes(filters.sort) 
                ? filters.sort 
                : 'due_date';

            // Validar direção de ordenação
            const order = filters.order && ['asc', 'desc'].includes(filters.order.toLowerCase())
                ? filters.order.toUpperCase()
                : 'DESC';

            // Construir query base
            const baseQuery = `
                SELECT 
                    i.installment_id,
                    i.payment_id,
                    i.installment_number,
                    i.due_date,
                    i.expected_date,
                    i.amount,
                    i.balance,
                    i.status,
                    p.full_name,
                    m.movement_id,
                    m.description as movement_description,
                    mp.total_amount as payment_total_amount,
                    mp.status as payment_status,
                    (SELECT COALESCE(json_agg(b.*) FILTER (WHERE b.installment_id IS NOT NULL), '[]'::json)
                     FROM boletos b
                     WHERE b.installment_id = i.installment_id 
                     AND b.status = 'A_RECEBER') as boletos
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                WHERE 1=1
            `;

            // Preparar parâmetros e condições
            const queryParams = [];
            const conditions = [];

            // Filtro por data inicial
            if (filters.start_date) {
                conditions.push(`i.due_date >= $${queryParams.length + 1}`);
                queryParams.push(filters.start_date);
            }

            // Filtro por data final
            if (filters.end_date) {
                conditions.push(`i.due_date <= $${queryParams.length + 1}`);
                queryParams.push(filters.end_date);
            }

            // Filtro por nome
            if (filters.full_name) {
                conditions.push(`p.full_name ILIKE $${queryParams.length + 1}`);
                queryParams.push(`%${filters.full_name}%`);
            }

            // Adicionar condições à query
            const whereClause = conditions.length > 0 
                ? `AND ${conditions.join(' AND ')}` 
                : '';

            // Mapeamento de colunas para ordenação
            const sortColumnMap = {
                'due_date': 'i.due_date',
                'amount': 'i.amount',
                'installment_number': 'i.installment_number',
                'status': 'i.status',
                'full_name': 'p.full_name'
            };

            // Query com paginação e ordenação
            const paginatedQuery = `
                ${baseQuery} ${whereClause}
                ORDER BY ${sortColumnMap[sort]} ${order}
                LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                WHERE 1=1 ${whereClause}
            `;

            // Adicionar parâmetros de paginação
            queryParams.push(limit, (page - 1) * limit);

            logger.info('Detalhes da consulta', {
                baseQuery,
                whereClause,
                queryParams,
                conditions,
                sort,
                order
            });

            // Executar queries
            const [resultRows, countResult] = await Promise.all([
                this.pool.query(paginatedQuery, queryParams),
                this.pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            logger.info('Detalhes dos boletos', {
                installmentId: resultRows.rows[0]?.installment_id,
                boletosCount: resultRows.rows[0]?.boletos?.length,
                boletosDetails: resultRows.rows[0]?.boletos
            });

            const totalItems = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(totalItems / limit);

            // Retornar resultado
            return {
                items: resultRows.rows,
                meta: {
                    currentPage: page,
                    itemCount: resultRows.rows.length,
                    itemsPerPage: limit,
                    totalItems,
                    totalPages
                },
                links: {
                    first: `/installments/details?page=1&limit=${limit}&sort=${sort}&order=${order}`,
                    previous: page > 1 ? `/installments/details?page=${page - 1}&limit=${limit}&sort=${sort}&order=${order}` : null,
                    next: page < totalPages ? `/installments/details?page=${page + 1}&limit=${limit}&sort=${sort}&order=${order}` : null,
                    last: `/installments/details?page=${totalPages}&limit=${limit}&sort=${sort}&order=${order}`
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar detalhes de parcelas', { 
                error: error.message,
                stack: error.stack,
                filters 
            });
            throw error;
        }
    }
}

module.exports = InstallmentService;
