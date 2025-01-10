const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');

class BoletoService {
    constructor({ boletoRepository, n8nService, taskService }) {
        this.repository = boletoRepository;
        this.n8nService = n8nService;
        this.taskService = taskService;
    }

    /**
     * Lista boletos com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de boletos
     */
    async listBoletos(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando boletos', { page, limit, filters });
            return await this.repository.findAll(page, limit, filters);
        } catch (error) {
            logger.error('Erro ao listar boletos', { error: error.message, filters });
            throw new DatabaseError('Erro ao listar boletos');
        }
    }

    /**
     * Lista boletos com detalhes, paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de boletos com detalhes
     */
    async listBoletosWithDetails(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando boletos com detalhes', { page, limit, filters });
            return await this.repository.findAllWithDetails(page, limit, filters);
        } catch (error) {
            logger.error('Erro ao listar boletos com detalhes', { error: error.message, filters });
            throw new DatabaseError('Erro ao listar boletos com detalhes');
        }
    }

    /**
     * Busca um boleto por ID
     * @param {number} id - ID do boleto
     * @returns {Promise<object>} Boleto encontrado
     */
    async getBoletoById(id) {
        try {
            logger.info('Serviço: Buscando boleto por ID', { id });
            return await this.repository.findById(id);
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID', { error: error.message, id });
            throw new DatabaseError('Erro ao buscar boleto');
        }
    }

    /**
     * Busca um boleto por ID com detalhes
     * @param {number} id - ID do boleto
     * @returns {Promise<object>} Boleto encontrado com detalhes
     */
    async getBoletoByIdWithDetails(id) {
        try {
            logger.info('Serviço: Buscando boleto por ID com detalhes', { id });
            return await this.repository.findByIdWithDetails(id);
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID com detalhes', { error: error.message, id });
            throw new DatabaseError('Erro ao buscar boleto com detalhes');
        }
    }

    /**
     * Cria um novo boleto
     * @param {object} data - Dados do boleto
     * @returns {Promise<object>} Boleto criado
     */
    async createBoleto(data) {
        try {
            logger.info('Serviço: Criando boleto', { data });
            const newBoleto = await this.repository.create({
                ...data,
                generated_at: new Date(),
                last_status_update: new Date(),
                status: 'A_EMITIR'
            });

            logger.info('BoletoService: Boleto criado, preparando criação de task', {
                boleto_id: newBoleto.boleto_id,
                installment_id: newBoleto.installment_id,
                movement_id: data.movement_id
            });

            // Criar tarefa para processamento do boleto
            try {
                logger.info('BoletoService: Verificando taskService', {
                    hasTaskService: !!this.taskService,
                    taskServiceMethods: this.taskService ? Object.keys(this.taskService) : [],
                    taskServiceType: this.taskService ? typeof this.taskService : 'undefined'
                });

                if (!this.taskService) {
                    logger.error('BoletoService: TaskService não definido');
                    return newBoleto;
                }

                // Verificar se o método create existe, caso contrário usar createTask
                const createMethod = this.taskService.create || this.taskService.createTask;

                logger.info('BoletoService: Método de criação identificado', {
                    hasCreateMethod: !!createMethod,
                    methodName: createMethod === this.taskService.create ? 'create' : 'createTask'
                });

                if (!createMethod) {
                    logger.error('BoletoService: Método de criação de tarefa não encontrado', {
                        availableMethods: Object.keys(this.taskService)
                    });
                    return newBoleto;
                }

                logger.info('BoletoService: Criando task com payload', {
                    type: 'boleto',
                    name: `Emissão de Boleto #${newBoleto.boleto_id}`,
                    boleto_id: newBoleto.boleto_id,
                    installment_id: newBoleto.installment_id,
                    movement_id: data.movement_id
                });

                const taskCreated = await createMethod.call(this.taskService, {
                    type: 'boleto',
                    name: `Emissão de Boleto #${newBoleto.boleto_id}`,
                    description: `Processamento de boleto bancário para ID ${newBoleto.boleto_id}`,
                    payload: {
                        billing: {
                            boleto_id: newBoleto.boleto_id,
                            installment_id: newBoleto.installment_id,
                            movement_id: data.movement_id
                        }
                    }
                });

                logger.info('BoletoService: Tarefa criada com sucesso', {
                    taskId: taskCreated?.task_id || 'ID não disponível',
                    boletoId: newBoleto.boleto_id
                });
            } catch (error) {
                logger.error('BoletoService: Erro ao criar tarefa de boleto', {
                    error: error.message,
                    errorStack: error.stack,
                    boletoId: newBoleto.boleto_id
                });
                // Não lança o erro para não interromper o fluxo de criação do boleto
            }

            return newBoleto;
        } catch (error) {
            logger.error('Erro ao criar boleto', { error: error.message, data });
            throw new DatabaseError('Erro ao criar boleto');
        }
    }

    /**
     * Atualiza um boleto existente
     * @param {number} id - ID do boleto
     * @param {object} data - Dados para atualização
     * @returns {Promise<object>} Boleto atualizado
     */
    async updateBoleto(id, data) {
        try {
            logger.info('Serviço: Atualizando boleto', { id, data });
            return await this.repository.updateBoleto(id, data);
        } catch (error) {
            logger.error('Erro ao atualizar boleto', { error: error.message, id, data });
            throw new DatabaseError('Erro ao atualizar boleto');
        }
    }

    /**
     * Busca boletos por ID do pagamento
     * @param {number} paymentId - ID do pagamento
     * @returns {Promise<Array>} Lista de boletos
     */
    async findByPaymentId(paymentId) {
        try {
            logger.info('Serviço: Buscando boletos por payment ID', { paymentId });
            return await this.repository.findByPaymentId(paymentId);
        } catch (error) {
            logger.error('Erro ao buscar boletos por payment ID', { error: error.message, paymentId });
            // Se houver erro, retorna array vazio
            return [];
        }
    }

    async findById(boletoId) {
        try {
            logger.info('Buscando boleto por ID', { boletoId });
            const boleto = await this.repository.findById(boletoId);
            
            if (!boleto) {
                throw new Error(`Boleto com ID ${boletoId} não encontrado`);
            }
            
            return boleto;
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID', {
                error: error.message,
                boletoId,
                stack: error.stack
            });
            throw error;
        }
    }

    async updateBoleto(boletoId, updateData) {
        try {
            logger.info('Atualizando boleto', { 
                boletoId, 
                updateData 
            });

            const updatedBoleto = await this.repository.update(boletoId, {
                ...updateData,
                updated_at: new Date()
            });

            logger.debug('Boleto atualizado com sucesso', { 
                boletoId, 
                newStatus: updateData.status 
            });

            return updatedBoleto;
        } catch (error) {
            logger.error('Erro ao atualizar boleto', {
                error: error.message,
                boletoId,
                updateData,
                stack: error.stack
            });
            throw error;
        }
    }

    async markAsFailed(boletoId, errorMessage) {
        try {
            logger.warn('Marcando boleto como falho', { 
                boletoId, 
                errorMessage 
            });

            return await this.repository.update(boletoId, {
                status: 'Erro de Emissão',
                error_message: errorMessage,
                updated_at: new Date()
            });
        } catch (error) {
            logger.error('Erro ao marcar boleto como falho', {
                error: error.message,
                boletoId,
                errorMessage,
                stack: error.stack
            });
            throw error;
        }
    }

    async emitirBoletoN8N(boleto) {
        try {
            logger.info('Emitindo boleto via N8N', { 
                boletoId: boleto.boleto_id 
            });

            // Validações de dados do boleto
            if (!boleto.valor || !boleto.data_vencimento || !boleto.pessoa_id) {
                throw new Error('Dados do boleto incompletos');
            }

            // Preparar payload para N8N
            const payload = {
                boleto_id: boleto.boleto_id,
                valor: boleto.valor,
                data_vencimento: boleto.data_vencimento,
                pessoa_id: boleto.pessoa_id
            };

            // Chamar serviço N8N
            const n8nResponse = await this.n8nService.createBoleto(payload);

            // Atualizar boleto com dados da emissão
            return this.updateBoleto(boleto.boleto_id, {
                status: 'Emitido',
                url_boleto: n8nResponse.url,
                linha_digitavel: n8nResponse.linha_digitavel,
                nosso_numero: n8nResponse.nosso_numero
            });

        } catch (error) {
            logger.error('Erro na emissão de boleto via N8N', {
                error: error.message,
                boleto,
                stack: error.stack
            });

            // Marcar boleto como falho
            await this.markAsFailed(boleto.boleto_id, error.message);

            throw error;
        }
    }
}

module.exports = BoletoService;
