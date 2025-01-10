const { logger } = require('../../../middlewares/logger');

class TaskService {
    constructor({ taskRepository, logsService }) {
        this.repository = taskRepository;
        this.logsService = logsService;
    }

    async getPendingTasks(limit = 10) {
        try {
            return await this.repository.findPendingTasks(limit);
        } catch (error) {
            logger.error('Erro ao buscar tasks pendentes', {
                error: error.message,
                limit
            });
            throw error;
        }
    }

    async create(data) {
        console.error('CONSOLE: TaskService.create chamado', { 
            data: JSON.stringify(data),
            timestamp: new Date().toISOString()
        });

        try {
            console.error('CONSOLE: Iniciando criação de task', { 
                data: JSON.stringify(data),
                repositoryExists: !!this.repository,
                logsServiceExists: !!this.logsService,
                timestamp: new Date().toISOString()
            });

            if (!this.repository) {
                console.error('CONSOLE: Repositório não definido', {
                    timestamp: new Date().toISOString()
                });
                throw new Error('TaskRepository não definido');
            }

            // Mapear tipos de tarefas para IDs fixos
            const taskTypeMap = {
                'boleto': 1,
                'email': 2,
                'nfse': 3,
                'backup': 4,
                'sync': 5
            };

            // Busca o tipo de task
            const taskTypeId = taskTypeMap[data.type];

            if (!taskTypeId) {
                console.error('CONSOLE: Tipo de tarefa não encontrado', {
                    type: data.type,
                    availableTypes: Object.keys(taskTypeMap),
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Tipo de tarefa "${data.type}" não encontrado no mapeamento`);
            }

            // Prepara dados da task
            const taskData = {
                type_id: taskTypeId,
                name: data.name || this.generateTaskName(data.type, data.payload),
                status: 'pending',
                payload: JSON.stringify(data.payload || {}),
                created_at: new Date(),
                updated_at: new Date()
            };

            console.error('CONSOLE: Dados da task preparados', { 
                taskData: JSON.stringify(taskData),
                repositoryMethod: !!this.repository?.create,
                timestamp: new Date().toISOString()
            });

            // Cria task
            const result = await this.repository.create(taskData);

            console.error('CONSOLE: Resultado da criação de task', { 
                result: JSON.stringify(result),
                timestamp: new Date().toISOString()
            });

            if (!result || !result.task_id) {
                console.error('CONSOLE: Falha na criação da tarefa', {
                    taskData: JSON.stringify(taskData),
                    result: JSON.stringify(result),
                    timestamp: new Date().toISOString()
                });
                throw new Error('Falha ao criar tarefa: resultado inválido');
            }

            // Cria log inicial
            if (this.logsService) {
                await this.logsService.create({
                    task_id: result.task_id,
                    status: 'pending',
                    metadata: { action: 'create' }
                });
            }

            console.error('CONSOLE: Task criada com sucesso', { 
                taskId: result.task_id,
                taskType: data.type,
                taskName: taskData.name,
                timestamp: new Date().toISOString()
            });

            return result;
        } catch (error) {
            console.error('CONSOLE: Erro crítico no TaskService', {
                error: error.message,
                errorStack: error.stack,
                data: JSON.stringify(data),
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    }

    async updateTaskStatus(taskId, status, error = null) {
        try {
            const task = await this.repository.updateTaskStatus(taskId, status, error);
            
            logger.info('Status da task atualizado', {
                taskId,
                status,
                hasError: !!error
            });

            return task;
        } catch (error) {
            logger.error('Erro ao atualizar status da task', {
                error: error.message,
                taskId,
                status
            });
            throw error;
        }
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            return await this.repository.findAll(filters, page, limit);
        } catch (error) {
            logger.error('Erro ao buscar tasks', {
                error: error.message,
                filters,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            return await this.repository.findById(id);
        } catch (error) {
            logger.error('Erro ao buscar task por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async getMetrics() {
        try {
            const [
                pendingTasks,
                failedTasks,
                totalTasks
            ] = await Promise.all([
                this.repository.countByStatus('pending'),
                this.repository.countByStatus('failed'),
                this.repository.count()
            ]);

            return {
                pendingTasks,
                failedTasks,
                totalTasks,
                failureRate: totalTasks > 0 ? failedTasks / totalTasks : 0
            };
        } catch (error) {
            logger.error('Erro ao coletar métricas', {
                error: error.message
            });
            throw error;
        }
    }

    generateTaskName(type, payload) {
        // Implementação do método generateTaskName
    }
}

module.exports = TaskService;
