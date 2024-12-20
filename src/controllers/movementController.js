const MovementService = require('../services/movementService');
const MovementPaymentsService = require('../services/movementPaymentsService');
const BoletoService = require('../services/boletoService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class MovementController {
    constructor() {
        this.movementPaymentsService = new MovementPaymentsService();
    }

    async index(req, res) {
        try {
            const { page, limit, ...filters } = req.query;

            const result = await MovementService.findAll(page, limit, filters);
            
            // Buscar pagamentos para cada movimento
            const movementsWithPayments = await Promise.all(result.movements.map(async (movement) => {
                const paymentsResult = await MovementService.getMovementPayments(
                    movement.movement_id, 
                    1, 
                    100, 
                    {}
                );
                
                return {
                    ...movement,
                    payments: paymentsResult.data || []
                };
            }));

            // Substituir movements por movementsWithPayments
            result.movements = movementsWithPayments;

            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro ao listar movimentações', { 
                error: error.message,
                query: req.query
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const movement = await MovementService.findById(id);
            
            if (!movement) {
                return handleResponse(res, 404, { message: 'Movimento não encontrado' });
            }

            // Buscar pagamentos do movimento
            const paymentsResult = await MovementService.getMovementPayments(id, 1, 100, {});
            movement.payments = paymentsResult.data || [];

            handleResponse(res, 200, movement);
        } catch (error) {
            logger.error('Erro ao buscar movimento', { 
                error: error.message,
                movementId: req.params.id
            });
            handleError(res, error);
        }
    }

    async create(req, res) {
        try {
            const movementData = req.body;
            const newMovement = await MovementService.create(movementData);
            handleResponse(res, 201, newMovement);
        } catch (error) {
            logger.error('Erro ao criar movimento', { 
                error: error.message,
                movementData: req.body
            });
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const movementData = req.body;
            
            const updatedMovement = await MovementService.update(id, movementData);
            
            if (!updatedMovement) {
                return handleResponse(res, 404, { message: 'Movimento não encontrado' });
            }

            handleResponse(res, 200, updatedMovement);
        } catch (error) {
            logger.error('Erro ao atualizar movimento', { 
                error: error.message,
                movementId: req.params.id,
                movementData: req.body
            });
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await MovementService.delete(id);
            handleResponse(res, 204);
        } catch (error) {
            logger.error('Erro ao excluir movimento', { 
                error: error.message,
                movementId: req.params.id
            });
            handleError(res, error);
        }
    }

    async createMovementWithPayment(req, res) {
        try {
            const movementData = req.body;

            // Validações básicas
            if (!movementData.movement_type_id) {
                return handleResponse(res, 400, { message: 'Tipo de movimento é obrigatório' });
            }

            if (!movementData.total_amount || movementData.total_amount <= 0) {
                return handleResponse(res, 400, { message: 'Valor do movimento deve ser maior que zero' });
            }

            // Verificar se método de pagamento foi informado
            if (!movementData.payment_method_id) {
                return handleResponse(res, 400, { message: 'Método de pagamento é obrigatório para esta operação' });
            }

            // Usar serviço de movimento para criar movimento com pagamento
            const newMovement = await MovementService.createMovementWithPayment(movementData);

            logger.info('Movimento com pagamento criado com sucesso', {
                movementId: newMovement.movement_id
            });

            handleResponse(res, 201, newMovement);
        } catch (error) {
            logger.error('Erro ao criar movimento com pagamento', { 
                error: error.message,
                movementData: req.body
            });
            handleError(res, error);
        }
    }

    async getPayments(req, res) {
        try {
            const { id } = req.params;
            const { page, limit, ...filters } = req.query;

            const result = await MovementService.getMovementPayments(
                id, 
                page, 
                limit, 
                filters
            );

            logger.info('Payments de movimento buscados com sucesso', { 
                movementId: id,
                totalPayments: result.meta.total
            });

            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro ao buscar payments de movimento', { 
                error: error.message,
                movementId: req.params.id
            });
            handleError(res, error);
        }
    }

    async emitirBoletos(req, res) {
        try {
            const { id } = req.params;

            logger.info('Iniciando emissão de boletos para movimento', { 
                movementId: id 
            });

            const boletos = await BoletoService.emitirBoletosMovimento(id);

            logger.info('Boletos emitidos com sucesso', { 
                movementId: id,
                quantidadeBoletos: boletos.length
            });

            handleResponse(res, 200, boletos);
        } catch (error) {
            logger.error('Erro ao emitir boletos', { 
                error: error.message,
                movementId: req.params.id
            });
            handleError(res, error);
        }
    }

    async listBoletos(req, res) {
        try {
            const { id } = req.params;
            const { page, limit } = req.query;

            const movement = await MovementService.findById(id);
            if (!movement) {
                return handleResponse(res, 404, { message: 'Movimento não encontrado' });
            }

            const boletos = await BoletoService.listBoletosByMovement(id, page, limit);
            handleResponse(res, 200, boletos);
        } catch (error) {
            logger.error('Erro ao listar boletos do movimento', {
                movementId: req.params.id,
                error: error.message,
                stack: error.stack
            });
            handleError(res, error);
        }
    }

    async emitirBoletos(req, res) {
        try {
            const { id } = req.params;

            const movement = await MovementService.findById(id);
            if (!movement) {
                return handleResponse(res, 404, { message: 'Movimento não encontrado' });
            }

            await BoletoService.emitirBoletosMovimento(id);
            handleResponse(res, 200, { message: 'Boletos emitidos com sucesso' });
        } catch (error) {
            logger.error('Erro ao emitir boletos do movimento', {
                movementId: req.params.id,
                error: error.message,
                stack: error.stack
            });
            handleError(res, error);
        }
    }

    async listInstallments(req, res) {
        try {
            const { id } = req.params;
            const { page, limit } = req.query;

            const movement = await MovementService.findById(id);
            if (!movement) {
                return handleResponse(res, 404, { message: 'Movimento não encontrado' });
            }

            const installments = await this.movementPaymentsService.listInstallments(id, page, limit);
            handleResponse(res, 200, installments);
        } catch (error) {
            logger.error('Erro ao listar parcelas do movimento', {
                movementId: req.params.id,
                error: error.message,
                stack: error.stack
            });
            handleError(res, error);
        }
    }
}

module.exports = new MovementController();
