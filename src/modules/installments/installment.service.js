const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const CreateInstallmentDTO = require('./dto/create-installment.dto');
const UpdateInstallmentDTO = require('./dto/update-installment.dto');
const InstallmentResponseDTO = require('./dto/installment-response.dto');
const moment = require('moment-timezone');

class InstallmentService {
    constructor({ 
        installmentRepository, 
        cacheService,
        boletoService,
        boletoRepository,
        n8nService
    } = {}) {
        this.repository = installmentRepository;
        this.cacheService = cacheService;
        this.boletoService = boletoService;
        this.boletoRepository = boletoRepository;
        this.n8nService = n8nService;
        this.cachePrefix = 'installments';
        this.cacheTTL = {
            list: 300, // 5 minutos
            detail: 300 // 5 minutos
        };
    }

    async listInstallments(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando parcelas', { page, limit, filters });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`, { page, limit, ...filters });
            const cached = await this.cacheService.get(cacheKey);
            
            if (cached) {
                logger.info('Cache hit: Retornando parcelas do cache');
                return cached;
            }

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

            // Transforma os resultados em DTOs
            const items = result.data.map(item => new InstallmentResponseDTO(item));
            const totalPages = Math.ceil(result.total / result.limit);

            const formattedResult = {
                items,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages
                }
            };

            // Salva no cache
            await this.cacheService.set(cacheKey, formattedResult, this.cacheTTL.list);

            return formattedResult;
        } catch (error) {
            logger.error('Erro ao listar parcelas', { 
                error: error.message, 
                filters,
                page,
                limit,
                stack: error.stack 
            });
            throw error;
        }
    }

    async getInstallmentById(id) {
        try {
            logger.info('Serviço: Buscando parcela por ID', { id });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id });
            const cached = await this.cacheService.get(cacheKey);
            
            if (cached) {
                logger.info('Cache hit: Retornando parcela do cache');
                return cached;
            }

            const installment = await this.repository.findInstallmentWithDetails(id);
            
            if (!installment) {
                throw new ValidationError('Parcela não encontrada');
            }

            const installmentResponse = new InstallmentResponseDTO(installment);
            
            await this.cacheService.set(cacheKey, installmentResponse, this.cacheTTL.detail);
            
            return installmentResponse;
        } catch (error) {
            logger.error('Erro ao buscar parcela por ID', { error, id });
            throw error;
        }
    }

    /**
     * Busca detalhes de uma parcela específica
     */
    async getInstallmentDetails(id) {
        try {
            logger.info('Serviço: Buscando detalhes da parcela', { id });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:details`, { id });
            const cached = await this.cacheService.get(cacheKey);
            
            if (cached) {
                logger.info('Cache hit: Retornando detalhes da parcela do cache');
                return cached;
            }

            const installment = await this.repository.findInstallmentWithDetails(id);
            
            if (!installment) {
                throw new ValidationError('Parcela não encontrada');
            }

            const installmentResponse = new InstallmentResponseDTO(installment);
            
            await this.cacheService.set(cacheKey, installmentResponse, this.cacheTTL.detail);
            
            return installmentResponse;
        } catch (error) {
            logger.error('Erro ao buscar detalhes da parcela', { error, id });
            throw error;
        }
    }

    async createInstallment(data) {
        const client = await this.repository.pool.connect();
        try {
            await client.query('BEGIN');

            // Criar DTO e validar
            const dto = new CreateInstallmentDTO(data);
            dto.validate();

            // Criar parcela
            const installment = await this.repository.createWithClient(client, {
                payment_id: dto.payment_id,
                installment_number: dto.installment_number,
                due_date: dto.due_date,
                amount: dto.amount,
                balance: dto.balance,
                status: dto.status,
                account_entry_id: dto.account_entry_id
            });

            await client.query('COMMIT');

            // Invalidar cache
            await this.cacheService.del(`${this.cachePrefix}:list:*`);
            
            return new InstallmentResponseDTO(installment);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao criar parcela', { error });
            throw error;
        } finally {
            client.release();
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

            // Invalidar cache
            await this.cacheService.del(`${this.cachePrefix}:detail:${id}`);
            await this.cacheService.del(`${this.cachePrefix}:list:*`);

            return new InstallmentResponseDTO(updatedInstallment);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao atualizar parcela', { error, id, data });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Atualiza a data de vencimento de uma parcela
     * @param {number} installmentId - ID da parcela
     * @param {string} newDueDate - Nova data de vencimento (formato ISO)
     * @param {number} [newAmount] - Novo valor da parcela (opcional)
     * @returns {Promise<Object>} Parcela atualizada
     */
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

            // Invalidar cache
            await this.cacheService.del(`${this.cachePrefix}:list:*`);
            await this.cacheService.del(`${this.cachePrefix}:detail:${id}`);
            
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

    /**
     * Registra o pagamento de uma parcela
     * @param {number} id - ID da parcela
     * @param {Object} paymentData - Dados do pagamento
     * @param {string} [paymentData.payment_date] - Data do pagamento (opcional, padrão é hoje)
     * @param {number} paymentData.value - Valor pago
     * @param {number} [paymentData.bank_id=2] - ID do banco (opcional, padrão 2)
     * @param {number} [paymentData.juros=0] - Juros (opcional, padrão 0)
     * @param {number} [paymentData.descontos=0] - Descontos (opcional, padrão 0)
     * @returns {Promise<Object>} Parcela atualizada após pagamento
     */
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

            // Invalidar cache
            await this.cacheService.del(`${this.cachePrefix}:detail:${id}`);
            await this.cacheService.del(`${this.cachePrefix}:list:*`);

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

    /**
     * Método auxiliar para cancelar boleto de forma assíncrona
     * @param {number} installmentId - ID da parcela
     * @returns {Promise<void>}
     */
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

    /**
     * Cancela boletos de uma parcela
     * @param {number} installmentId - ID da parcela
     * @returns {Promise<Array>} Boletos cancelados
     */
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
}

module.exports = InstallmentService;
