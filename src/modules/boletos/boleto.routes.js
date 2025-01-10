const { Router } = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const { logger } = require('../../middlewares/logger');
const boletoSchema = require('./schemas/boleto.schema');
const container = require('../../config/container');

/**
 * @param {import('./boleto.controller')} boletoController 
 */
module.exports = (boletoController) => {
    const router = Router();
    const taskService = container.resolve('taskService');

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    // Middleware de log para todas as rotas
    router.use((req, res, next) => {
        logger.info('Requisição recebida', {
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            query: req.query
        });
        next();
    });

    // Rotas
    router.get('/',
        validateRequest(boletoSchema.listBoletos, 'query'),
        boletoController.index.bind(boletoController)
    );

    router.get('/details',
        validateRequest(boletoSchema.listBoletos, 'query'),
        boletoController.listWithDetails.bind(boletoController)
    );

    router.get('/:id',
        validateRequest(boletoSchema.getBoletoById, 'params'),
        boletoController.show.bind(boletoController)
    );

    router.get('/:id/details',
        validateRequest(boletoSchema.getBoletoById, 'params'),
        boletoController.showWithDetails.bind(boletoController)
    );

    router.post('/',
        validateRequest(boletoSchema.createBoleto, 'body'),
        boletoController.store.bind(boletoController)
    );

    router.post('/movimento/:movimentoId',
        validateRequest({
            type: 'object',
            properties: {
                movimentoId: { type: 'number' }
            },
            required: ['movimentoId']
        }, 'params'),
        boletoController.createBoletosMovimento.bind(boletoController)
    );

    router.post('/:id/task', async (req, res) => {
        try {
            const boletoId = req.params.id;
            
            // Primeiro tenta encontrar uma task existente para este boleto
            const tasks = await taskService.findAll({
                type: 'boleto',
                payload: { boleto_id: boletoId }
            });

            // Se encontrou uma task e ela ainda está pendente ou em execução, retorna ela
            if (tasks && tasks.length > 0) {
                const task = tasks[0];
                if (task.status === 'pending' || task.status === 'running') {
                    return res.status(200).json({
                        message: 'Task já está em processamento',
                        task
                    });
                }

                // Se a task falhou e ainda pode ser retentada, não cria uma nova
                if (task.status === 'failed' && task.retries < task.max_retries) {
                    return res.status(200).json({
                        message: 'Task será retentada automaticamente',
                        task
                    });
                }
            }

            // Se não encontrou task ou a anterior falhou definitivamente, cria uma nova
            const taskData = {
                type: 'boleto',
                name: `Boleto ${boletoId}`,
                status: 'pending',
                payload: {
                    boleto_id: boletoId
                }
            };

            const task = await taskService.create(taskData);
            res.status(201).json(task);
        } catch (error) {
            logger.error('Erro ao processar task para boleto', {
                error: error.message,
                boletoId: req.params.id
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    router.put('/:id',
        validateRequest(boletoSchema.updateBoleto, 'body'),
        validateRequest(boletoSchema.getBoletoById, 'params'),
        boletoController.update.bind(boletoController)
    );

    return router;
};
