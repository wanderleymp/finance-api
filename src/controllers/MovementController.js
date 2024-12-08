const PrismaMovementRepository = require('../repositories/implementations/PrismaMovementRepository');
const logger = require('../../config/logger');
const { MovementError } = require('../utils/errors/MovementError');
const BoletoRabbitMQService = require('../services/boletoRabbitMqService');
const { callNfseWebhook } = require('../services/nfseWebhookService');
const nfseRabbitMQService = require('../services/nfseRabbitMQService');

class MovementController {
    constructor() {
        this.movementRepository = new PrismaMovementRepository();
        this.boletoRabbitMQService = BoletoRabbitMQService;
    }

    async createMovement(req, res) {
        try {
            const movement = await this.movementRepository.createMovement(req.body);
            
            // Log audit trail
            await this.movementRepository.createMovementHistory({
                movement_id: movement.movement_id,
                user_id: req.user.id,
                action: 'CREATE',
                changes: JSON.stringify(movement)
            });

            res.status(201).json(movement);
        } catch (error) {
            logger.error('Error in create movement controller:', { 
                error: error.message,
                user: req.user?.id,
                body: req.body
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMovementById(req, res) {
        try {
            const movement = await this.movementRepository.getMovementById(req.params.id);
            res.json(movement);
        } catch (error) {
            logger.error('Error in get movement by id controller:', { 
                error: error.message,
                user: req.user?.id,
                movement_id: req.params.id
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllMovements(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                sort_field = 'movement_date',
                sort_order = 'desc',
                ...filters 
            } = req.query;

            const skip = (page - 1) * limit;
            const movements = await this.movementRepository.getAllMovements(
                filters,
                skip,
                parseInt(limit),
                { field: sort_field, order: sort_order }
            );

            res.json(movements);
        } catch (error) {
            logger.error('Error in get all movements controller:', { 
                error: error.message,
                user: req.user?.id,
                query: req.query
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateMovement(req, res) {
        try {
            const oldMovement = await this.movementRepository.getMovementById(req.params.id);
            const movement = await this.movementRepository.updateMovement(req.params.id, req.body);
            
            // Log audit trail
            await this.movementRepository.createMovementHistory({
                movement_id: movement.movement_id,
                user_id: req.user.id,
                action: 'UPDATE',
                changes: JSON.stringify({
                    before: oldMovement,
                    after: movement
                })
            });

            res.json(movement);
        } catch (error) {
            logger.error('Error in update movement controller:', { 
                error: error.message,
                user: req.user?.id,
                movement_id: req.params.id,
                body: req.body
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteMovement(req, res) {
        try {
            await this.movementRepository.deleteMovement(req.params.id);
            
            // Log audit trail
            await this.movementRepository.createMovementHistory({
                movement_id: parseInt(req.params.id),
                user_id: req.user.id,
                action: 'DELETE',
                changes: null
            });

            res.status(204).send();
        } catch (error) {
            logger.error('Error in delete movement controller:', { 
                error: error.message,
                user: req.user?.id,
                movement_id: req.params.id
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMovementHistory(req, res) {
        try {
            const history = await this.movementRepository.getMovementHistory(req.params.id);
            res.json(history);
        } catch (error) {
            logger.error('Error in get movement history controller:', { 
                error: error.message,
                user: req.user?.id,
                movement_id: req.params.id
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async generateBoleto(req, res) {
        try {
            const { movementId } = req.params;

            // Validar movimento
            const movement = await this.movementRepository.getMovementById(movementId);
            if (!movement) {
                return res.status(404).json({ error: 'Movimento não encontrado' });
            }

            // Publicar tarefa de geração de boleto na fila
            const task = await this.boletoRabbitMQService.publishBoletoGenerationTask(movementId);

            return res.status(202).json({
                message: 'Solicitação de geração de boleto enviada para processamento',
                task_id: task.task_id,
                movement_id: movementId
            });
        } catch (error) {
            logger.error('Erro ao gerar boleto:', error);
            return res.status(500).json({ 
                error: 'Erro interno ao processar solicitação de boleto',
                details: error.message 
            });
        }
    }

    async getBoletoStatus(req, res) {
        try {
            const { taskId } = req.params;
            const status = await this.boletoRabbitMQService.getBoletoStatus(parseInt(taskId));
            res.json(status);
        } catch (error) {
            logger.error('Error getting boleto status:', error);
            res.status(500).json({
                error: 'Failed to get boleto status',
                details: error.message
            });
        }
    }

    async generateNfse(req, res) {
        try {
            const { id: movementId } = req.params;
            const movement_id = parseInt(movementId);

            if (!movement_id) {
                return res.status(400).json({ error: 'ID do movimento é obrigatório' });
            }

            try {
                // Tentar criar a tarefa primeiro
                const taskResult = await nfseRabbitMQService.publishNfseGenerationTask(movement_id);
                
                logger.info('Tarefa de geração de NFSe criada com sucesso', {
                    task_id: taskResult.task_id,
                    movement_id,
                    scheduled_for: taskResult.scheduled_for
                });

                res.json({ 
                    message: 'Solicitação de geração de NFSe agendada com sucesso',
                    task_id: taskResult.task_id,
                    scheduled_for: taskResult.scheduled_for
                });
            } catch (taskError) {
                // Se falhar ao criar a tarefa, tenta chamar o webhook diretamente
                logger.warn('Falha ao criar tarefa de geração de NFSe, tentando webhook direto:', {
                    error: taskError.message,
                    movement_id
                });

                await callNfseWebhook(movement_id);
                
                res.json({ 
                    message: 'Solicitação de geração de NFSe enviada com sucesso (modo direto)',
                    warning: 'Não foi possível criar a tarefa de acompanhamento'
                });
            }
        } catch (error) {
            logger.error('Error in generateNfse controller:', { 
                message: error.message,
                movementId: req.params.id 
            });
            res.status(500).json({ error: 'Erro ao gerar NFSe' });
        }
    }

    async getNfseStatus(req, res) {
        const taskId = parseInt(req.params.taskId);

        try {
            const task = await this.movementRepository.prisma.tasks.findUnique({
                where: { task_id: taskId },
                include: {
                    tasks_status: true,
                    tasks_logs: {
                        orderBy: { created_at: 'asc' }
                    }
                }
            });

            if (!task) {
                return res.status(404).json({ error: 'Tarefa não encontrada' });
            }

            const response = {
                task_id: task.task_id,
                status: task.tasks_status.name,
                created_at: task.created_at,
                logs: task.tasks_logs.map(log => ({
                    status: log.status,
                    message: log.message,
                    created_at: log.created_at
                }))
            };

            res.json(response);
        } catch (error) {
            logger.error('Erro ao buscar status da NFSe:', error);
            res.status(500).json({ error: 'Erro ao buscar status da NFSe' });
        }
    }
}

module.exports = MovementController;
