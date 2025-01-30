const { logger } = require('../../middlewares/logger');
const { createMovementSchema } = require('./validators/movement.validator');
const { ValidationError } = require('../../utils/errors');
const MovementService = require('./movement.service');

class MovementController {
    constructor({ movementService }) {
        this.service = movementService;
    }

    async index(req, res) {
        try {
            const { page = 1, limit = 10, detailed = false, ...filters } = req.query;
            
            logger.info('Controller: Listando movimentos', { 
                page, 
                limit,
                detailed,
                filters 
            });

            const result = await this.service.findAll(
                parseInt(page), 
                parseInt(limit), 
                filters,
                detailed === 'true'
            );

            return res.json(result);
        } catch (error) {
            logger.error('Controller: Erro ao listar movimentos', {
                error: error.message,
                error_stack: error.stack,
                query: req.query
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    async show(req, res) {
        try {
            const id = parseInt(req.params.id);
            const detailed = req.query.detailed === 'true';
            const include = req.query.include;

            logger.info('Controller: Buscando movimento por ID', {
                id,
                detailed,
                include
            });

            const result = await this.service.getMovementById(id, detailed, include);
            return res.json(result);
        } catch (error) {
            logger.error('Controller: Erro ao buscar movimento', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id,
                detailed: req.query.detailed,
                include: req.query.include,
                error_full: JSON.stringify(error, Object.getOwnPropertyNames(error))
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    async create(req, res) {
        try {
            logger.info('Controller: Criando movimento', { data: req.body });

            // Validar e aplicar defaults
            const { value, error } = createMovementSchema.validate(req.body, { 
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                throw new ValidationError('Erro de validação', error.details);
            }

            // Extrair userId do token JWT
            const userId = req.user.userId;
            
            // Adicionar userId aos dados do movimento
            const movementData = {
                ...value,
                user_id: userId
            };

            const result = await this.service.create(movementData);
            return res.json(result);
        } catch (error) {
            logger.error('Controller: Erro ao criar movimento', {
                error: error.message,
                error_stack: error.stack,
                data: req.body
            });

            if (error instanceof ValidationError) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    details: error.details
                });
            }

            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            
            logger.info('Controller: Atualizando movimento', { id, data });

            const movement = await this.service.update(parseInt(id), data);
            return res.json(movement);
        } catch (error) {
            logger.error('Controller: Erro ao atualizar movimento', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id,
                data: req.body
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Removendo movimento', { id });

            await this.service.delete(parseInt(id));
            return res.status(204).send();
        } catch (error) {
            logger.error('Controller: Erro ao remover movimento', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            logger.info('Controller: Atualizando status do movimento', { id, status });

            const movement = await this.service.updateStatus(parseInt(id), status);
            return res.json(movement);
        } catch (error) {
            logger.error('Controller: Erro ao atualizar status do movimento', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id,
                status: req.body.status
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    /**
     * Lista os pagamentos de um movimento
     */
    async listPayments(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Listando pagamentos do movimento', { id });

            const result = await this.service.findPaymentsByMovementId(parseInt(id));
            return res.json(result);
        } catch (error) {
            logger.error('Controller: Erro ao listar pagamentos do movimento', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    /**
     * Lista as parcelas de um pagamento específico
     */
    async listPaymentInstallments(req, res) {
        try {
            const { id, paymentId } = req.params;
            
            logger.info('Controller: Listando parcelas do pagamento', { 
                movementId: id,
                paymentId 
            });

            const result = await this.service.findInstallmentsByPaymentId(parseInt(id), parseInt(paymentId));
            return res.json(result);
        } catch (error) {
            logger.error('Controller: Erro ao listar parcelas do pagamento', {
                error: error.message,
                error_stack: error.stack,
                movementId: req.params.id,
                paymentId: req.params.paymentId
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    /**
     * Cria um novo pagamento para o movimento
     */
    async createPayment(req, res) {
        try {
            const { id } = req.params;
            const paymentData = req.body;
            
            logger.info('Controller: Criando pagamento para o movimento', { 
                movementId: id,
                paymentData 
            });

            const result = await this.service.createPayment(parseInt(id), paymentData);
            return res.status(201).json(result);
        } catch (error) {
            logger.error('Controller: Erro ao criar pagamento', {
                error: error.message,
                error_stack: error.stack,
                movementId: req.params.id,
                paymentData: req.body
            });
            
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    /**
     * Remove um pagamento do movimento
     */
    async deletePayment(req, res) {
        try {
            const { id, paymentId } = req.params;
            
            logger.info('Controller: Removendo pagamento do movimento', { 
                movementId: id,
                paymentId 
            });

            await this.service.deletePayment(parseInt(id), parseInt(paymentId));
            return res.status(204).send();
        } catch (error) {
            logger.error('Controller: Erro ao remover pagamento', {
                error: error.message,
                error_stack: error.stack,
                movementId: req.params.id,
                paymentId: req.params.paymentId
            });
            
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    /**
     * Envia mensagem de faturamento
     */
    async sendBillingMessage(req, res) {
        try {
            const { id } = req.params;

            console.log('CONTROLLER: Enviando mensagem de faturamento', { 
                movementId: id,
                user: req.user // Log do usuário que está fazendo a requisição
            });

            logger.info('Controller: Iniciando envio de mensagem de faturamento', { 
                movementId: id,
                user: req.user // Log do usuário que está fazendo a requisição
            });

            // Busca movimento e pessoa
            const movement = await this.service.findOne(id);
            
            if (!movement) {
                console.log('CONTROLLER: Movimento não encontrado', { movementId: id });
                logger.warn('Movimento não encontrado', { 
                    movementId: id 
                });
                return res.status(404).json({ 
                    error: 'Movimento não encontrado' 
                });
            }

            // Verifica se o movimento tem pessoa associada
            if (!movement.person) {
                console.log('CONTROLLER: Movimento sem pessoa associada', { movementId: id });
                logger.warn('Movimento sem pessoa associada', { 
                    movementId: id 
                });
                return res.status(400).json({ 
                    error: 'Movimento não possui pessoa associada' 
                });
            }

            // Processa mensagem de faturamento
            await this.service._processBillingMessage(movement, movement.person);

            console.log('CONTROLLER: Mensagem de faturamento enviada com sucesso', { 
                movementId: id,
                personId: movement.person.person_id
            });

            logger.info('Mensagem de faturamento enviada com sucesso', { 
                movementId: id,
                personId: movement.person.person_id
            });

            return res.json({ 
                message: 'Mensagem de faturamento enviada com sucesso' 
            });
        } catch (error) {
            console.log('CONTROLLER: Erro ao enviar mensagem de faturamento', {
                error: error,
                errorMessage: error.message,
                errorStack: error.stack
            });

            // Log detalhado do erro
            logger.error('Erro completo ao enviar mensagem de faturamento', {
                error: error,
                errorMessage: error.message,
                errorStack: error.stack,
                movementId: req.params.id,
                // Adiciona informações adicionais de contexto
                requestBody: req.body,
                requestParams: req.params,
                requestQuery: req.query
            });

            return res.status(500).json({ 
                error: 'Erro interno ao processar mensagem de faturamento',
                details: error.message
            });
        }
    }

    /**
     * Cria boletos para um movimento
     */
    async createBoletos(req, res, next) {
        try {
            const { id } = req.params;
            logger.info('Controller: Criando boletos para movimento', { id });
            
            const boletos = await this.service.createBoletosMovimento(parseInt(id));
            res.status(201).json(boletos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancela um movimento
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     * @returns {Object} Resposta com resultado do cancelamento
     */
    async cancel(req, res) {
        try {
            const { id } = req.params;
            
            // Chama o método de cancelamento no serviço
            const canceledMovement = await this.service.cancelMovement(id);
            
            return res.json(canceledMovement);
        } catch (error) {
            // Tratamento de erro
            logger.error('Erro ao cancelar movimento', { 
                movementId: req.params.id, 
                error: error.message,
                errorStack: error.stack,
                requestBody: req.body,
                requestParams: req.params,
                requestQuery: req.query
            });
            
            // Verifica se é um erro de validação
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: 'Erro interno ao cancelar movimento' });
        }
    }

    /**
     * Cria uma NFSE para um movimento específico
     * @param {Request} req - Requisição HTTP
     * @param {Response} res - Resposta HTTP
     */
    async createMovementNFSe(req, res) {
        try {
            const { id } = req.params;
            const { ambiente } = req.body;

            logger.info('Criando NFSE para movimento', { 
                movementId: id, 
                ambiente,
                bodyCompleto: JSON.stringify(req.body, null, 2)
            });

            const nfse = await this.service.createMovementNFSe(parseInt(id), req.body);

            return res.status(201).json({
                success: true,
                message: 'NFSE criada com sucesso',
                nfse
            });
        } catch (error) {
            logger.error('Erro ao criar NFSE para movimento', { 
                error: error.message,
                stack: error.stack 
            });

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getDetailedMovement(req, res) {
        try {
            console.log('Controlador getDetailedMovement chamado:', {
                movementId: req.params.movementId,
                headers: req.headers,
                body: req.body,
                query: req.query
            });
            
            const { movementId } = req.params;
            const detailedMovement = await this.service.getDetailedMovement(movementId);
            
            return res.status(200).json(detailedMovement);
        } catch (error) {
            logger.error('Erro no controlador ao buscar movimento detalhado:', error);
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Erro interno do servidor'
            });
        }
    }

    /**
     * Notifica faturamento de um movimento
     * @route POST /movements/:id/notify-billing
     */
    async notifyBilling(req, res) {
        try {
            // Captura movementId de diferentes formas
            const movementId = parseInt(
                req.params.movementId || 
                req.params.id || 
                req.body.movement_id
            );

            // Validação de ID
            if (!movementId || isNaN(movementId)) {
                return res.status(400).json({
                    message: 'ID de movimento inválido',
                    details: {
                        params: req.params,
                        body: req.body
                    }
                });
            }

            logger.info('Controller: Notificando faturamento de movimento', { 
                movementId,
                requestBody: req.body,
                requestHeaders: req.headers
            });

            const result = await this.service.notifyBilling(movementId);

            logger.info('Controller: Notificação de faturamento concluída', { 
                movementId, 
                result 
            });

            return res.status(200).json({
                message: 'Notificação de faturamento enviada com sucesso',
                data: result
            });
        } catch (error) {
            logger.error('Controller: Erro na notificação de faturamento', {
                movementId: req.params.movementId || req.params.id || req.body.movement_id,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                fullError: error
            });

            return res.status(500).json({
                message: 'Erro ao notificar faturamento',
                error: {
                    message: error.message,
                    details: error.toString()
                }
            });
        }
    }
}

module.exports = MovementController;
