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
        boletoRepository = new (require('../boletos/boleto.repository'))(),
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

                // Dividir o valor por 100 antes de salvar
                const amountInCents = dto.amount;
                const amountInReais = amountInCents / 100;

                // Criar parcela
                const installment = await this.repository.createWithClient(transactionClient, {
                    payment_id: dto.payment_id,
                    installment_number: dto.installment_number,
                    due_date: dto.due_date,
                    amount: amountInReais,
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

            // Dividir o valor por 100 antes de salvar
            const amountInCents = dto.amount;
            const amountInReais = amountInCents / 100;

            const installment = await this.repository.createWithClient(client, {
                payment_id: dto.payment_id,
                installment_number: dto.installment_number,
                due_date: dto.due_date,
                amount: amountInReais,
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

    async findInstallmentsDetails(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Service: Iniciando findInstallmentsDetails', { 
                method: 'findInstallmentsDetails',
                page, 
                limit, 
                filters 
            });

            // Buscar parcelas usando o método do repository
            const items = await this.repository.findAllWithDetails(page, limit, filters);

            logger.info('Service: Resultado do findAllWithDetails', {
                method: 'findInstallmentsDetails',
                itemsCount: items?.length || 0,
                firstItem: items?.[0],
                hasMovementStatusFilter: items?.[0]?.movement_status_id === 2
            });

            if (!items || items.length === 0) {
                logger.info('Service: Nenhuma parcela encontrada', { 
                    page, 
                    limit, 
                    filters 
                });
                return {
                    items: [],
                    meta: {
                        currentPage: page,
                        itemCount: 0,
                        itemsPerPage: limit,
                        totalItems: 0,
                        totalPages: 0
                    },
                    links: {
                        first: `/installments/details?page=1&limit=${limit}`,
                        previous: null,
                        next: null,
                        last: `/installments/details?page=1&limit=${limit}`
                    }
                };
            }

            // Buscar boletos para cada parcela
            for (const item of items) {
                if (item.installment_id) {
                    const boletos = await this.boletoRepository.findByInstallmentId(item.installment_id);
                    logger.info('Detalhes dos boletos', {
                        installmentId: item.installment_id,
                        boletosCount: boletos.length,
                        boletosDetails: boletos
                    });
                    item.boletos = boletos.filter(b => b.status === 'A_RECEBER');
                }
            }

            // Calcular meta informações
            const totalItems = items.length;
            const totalPages = Math.ceil(totalItems / limit);
            const currentPage = page;

            logger.info('Service: Detalhes das parcelas recuperados', {
                totalItems,
                totalPages,
                currentPage,
                itemCount: items.length
            });

            // Construir links de paginação
            const links = {
                first: `/installments/details?page=1&limit=${limit}`,
                previous: page > 1 ? `/installments/details?page=${page - 1}&limit=${limit}` : null,
                next: page < totalPages ? `/installments/details?page=${page + 1}&limit=${limit}` : null,
                last: `/installments/details?page=${totalPages}&limit=${limit}`
            };

            // Adicionar parâmetros de ordenação aos links se existirem
            if (filters.sort) {
                const orderParams = `&sort=${filters.sort}&order=${filters.order || 'DESC'}`;
                Object.keys(links).forEach(key => {
                    if (links[key]) {
                        links[key] += orderParams;
                    }
                });
            }

            return {
                items,
                meta: {
                    currentPage,
                    itemCount: items.length,
                    itemsPerPage: limit,
                    totalItems,
                    totalPages
                },
                links
            };

        } catch (error) {
            logger.error('Service: Erro ao buscar detalhes das parcelas', {
                error: error.message,
                stack: error.stack,
                page,
                limit,
                filters
            });
            throw error;
        }
    }
}

module.exports = InstallmentService;
