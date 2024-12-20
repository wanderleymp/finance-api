const tasksService = require('../services/tasksService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');
const BoletoProcessor = require('../processors/boletoProcessor');
const { ValidationError } = require('../utils/errors');

class TasksController {
    async index(req, res) {
        try {
            const { page = 1, limit = 10, status, type } = req.query;
            
            logger.info('Iniciando listagem de tarefas', {
                query: req.query
            });
            
            const tasks = await tasksService.listTasks({ page, limit, status, type });
            
            logger.info('Listagem de tarefas concluída', { 
                count: tasks.data.length,
                currentPage: tasks.meta.current_page,
                totalRecords: tasks.meta.total
            });
            
            handleResponse(res, 200, tasks);
        } catch (error) {
            logger.error('Erro na listagem de tarefas', { 
                error: error.message,
                query: req.query
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Buscando tarefa por ID', { id });
            
            const task = await tasksService.getTaskById(id);
            
            if (!task) {
                return handleResponse(res, 404, { message: 'Tarefa não encontrada' });
            }

            handleResponse(res, 200, task);
        } catch (error) {
            logger.error('Erro ao buscar tarefa', { 
                error: error.message,
                taskId: req.params.id
            });
            handleError(res, error);
        }
    }

    async listByType(req, res) {
        try {
            const { type } = req.params;
            const { page = 1, limit = 10, status } = req.query;
            
            logger.info('Listando tarefas por tipo', { 
                type,
                query: req.query
            });
            
            const tasks = await tasksService.listTasksByType(type, { page, limit, status });
            
            logger.info('Listagem de tarefas por tipo concluída', { 
                type,
                count: tasks.data.length
            });
            
            handleResponse(res, 200, tasks);
        } catch (error) {
            logger.error('Erro ao listar tarefas por tipo', { 
                error: error.message,
                type: req.params.type,
                query: req.query
            });
            handleError(res, error);
        }
    }

    async listTypes(req, res) {
        try {
            logger.info('Listando tipos de tarefas');
            
            const types = await tasksService.listTaskTypes();
            
            logger.info('Listagem de tipos de tarefas concluída', { 
                count: types.length 
            });
            
            handleResponse(res, 200, types);
        } catch (error) {
            logger.error('Erro ao listar tipos de tarefas', { 
                error: error.message
            });
            handleError(res, error);
        }
    }

    async processTask(req, res) {
        try {
            const { id } = req.params;
            
            // Buscar a task
            const task = await tasksService.getTaskById(id);
            if (!task) {
                throw new ValidationError('Tarefa não encontrada');
            }

            // Verificar se a task já foi processada
            if (task.status !== 'pending') {
                throw new ValidationError(`Tarefa não pode ser processada pois está com status ${task.status}`);
            }

            // Processar baseado no tipo
            switch (task.type_name) {
                case 'BOLETO':
                    await BoletoProcessor.process(task);
                    break;
                // Adicionar outros tipos aqui
                default:
                    throw new ValidationError(`Tipo de tarefa ${task.type_name} não suportado para processamento manual`);
            }

            handleResponse(res, 200, { message: 'Tarefa processada com sucesso' });
        } catch (error) {
            logger.error('Erro ao processar tarefa', { 
                taskId: req.params.id,
                error: error.message 
            });

            if (error instanceof ValidationError) {
                handleError(res, error, 400);
            } else {
                handleError(res, error);
            }
        }
    }
}

module.exports = new TasksController();
