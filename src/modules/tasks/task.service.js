const { logger } = require('../../middlewares/logger');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');

class TaskService {
    constructor({ taskRepository, taskLogsService, taskDependenciesService, taskTypesRepository }) {
        this.repository = taskRepository;
        this.logsService = taskLogsService;
        this.dependenciesService = taskDependenciesService;
        this.taskTypesRepository = taskTypesRepository;
    }

    async getTypeIdByName(typeName) {
        try {
            logger.info('TaskService: Buscando ID do tipo de task', { 
                typeName 
            });

            // Hardcoded mapping for task types
            const taskTypeMap = {
                'email': 3,
                'boleto': 1,
                'nfse': 2,
                'backup': 4,
                'sync': 5
            };

            if (!taskTypeMap[typeName]) {
                logger.warn('Tipo de task não encontrado', {
                    typeName,
                    availableTypes: Object.keys(taskTypeMap)
                });
                throw new Error(`Tipo de task não encontrado: ${typeName}`);
            }

            const typeId = taskTypeMap[typeName];

            logger.debug('TaskService: Tipo de task encontrado', { 
                typeName,
                typeId 
            });

            return typeId;
        } catch (error) {
            logger.error('Erro ao buscar tipo de task', {
                error: error.message,
                typeName
            });
            throw error;
        }
    }

    async create(data) {
        try {
            logger.info('TaskService: Iniciando criação de task', { 
                taskType: data.type,
                payload: data.payload
            });

            // Busca o tipo de task
            const taskTypeId = await this.getTypeIdByName(data.type);

            logger.debug('TaskService: Tipo de task encontrado', { 
                taskType: data.type,
                taskTypeId 
            });

            // Gera um nome para a task baseado no tipo e payload
            const generateTaskName = (type, payload) => {
                switch (type) {
                    case 'email':
                        return `Email para ${payload.to || 'destinatário'}`;
                    case 'boleto':
                        return `Boleto ${payload.documentNumber || 'sem número'}`;
                    case 'nfse':
                        return `NFSE ${payload.serviceDescription || 'sem descrição'}`;
                    case 'backup':
                        return `Backup ${new Date().toISOString().split('T')[0]}`;
                    case 'sync':
                        return `Sincronização ${payload.entityType || 'geral'}`;
                    default:
                        return `Task ${type} ${new Date().getTime()}`;
                }
            };

            // Prepara dados da task
            const taskData = {
                type_id: taskTypeId,
                name: generateTaskName(data.type, data.payload),
                status: 'pending',
                payload: JSON.stringify(data.payload),
                created_at: new Date(),
                updated_at: new Date()
            };

            logger.debug('TaskService: Dados da task preparados', { taskData });

            // Cria task
            const result = await this.repository.create(taskData);

            logger.info('TaskService: Task criada com sucesso', { 
                taskId: result.task_id,
                taskType: data.type,
                taskName: taskData.name
            });

            // Cria log inicial
            await this.logsService.create({
                task_id: result.task_id,
                status: 'pending',
                metadata: { action: 'create' }
            });

            return result;
        } catch (error) {
            logger.error('TaskService: Erro ao criar task', {
                error: error.message,
                errorStack: error.stack,
                taskType: data.type,
                payload: data.payload
            });
            throw error;
        }
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            logger.info('Buscando tasks', { filters, page, limit });
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
            logger.info('Buscando task por ID', { id });
            const task = await this.repository.findById(id);
            if (!task) {
                throw new Error('Task não encontrada');
            }
            return task;
        } catch (error) {
            logger.error('Erro ao buscar task', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Atualizando task', { id, data });

            // Converte tipo para type_id
            if (data.type && !data.type_id) {
                data.type_id = await this.getTypeIdByName(data.type);
            }

            // Verifica se a task existe
            const existingTask = await this.repository.findById(id);
            if (!existingTask) {
                throw new Error('Task não encontrada');
            }

            // Se estiver alterando o status, registra no log
            if (data.status && data.status !== existingTask.status) {
                await this.logsService.create({
                    task_id: id,
                    status: data.status,
                    metadata: { 
                        action: 'status_change',
                        previous_status: existingTask.status
                    }
                });
            }

            return await this.repository.update(id, data);
        } catch (error) {
            logger.error('Erro ao atualizar task', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deletando task', { id });

            // Verifica se a task existe
            const task = await this.repository.findById(id);
            if (!task) {
                throw new Error('Task não encontrada');
            }

            // Verifica se existem tasks que dependem desta
            const dependentTasks = await this.dependenciesService.findDependentTasks(id);
            if (dependentTasks.length > 0) {
                throw new Error('Existem tasks que dependem desta task');
            }

            return await this.repository.delete(id);
        } catch (error) {
            logger.error('Erro ao deletar task', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findPendingTasks(limit = 10) {
        try {
            logger.debug('Buscando tasks pendentes', { limit });
            return await this.repository.findPendingTasks(limit);
        } catch (error) {
            logger.error('Erro ao buscar tasks pendentes', {
                error: error.message,
                limit
            });
            throw error;
        }
    }

    async processTask(id) {
        try {
            logger.info('Processando task', { id });

            // Atualiza status para running
            await this.update(id, { status: 'running' });

            // Aqui você implementaria a lógica de processamento da task
            // Por exemplo, chamar um worker específico baseado no tipo da task

            // Por enquanto, vamos apenas simular um processamento bem-sucedido
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Atualiza status para success
            await this.update(id, { status: 'success' });

            return true;
        } catch (error) {
            logger.error('Erro ao processar task', {
                error: error.message,
                id
            });

            // Atualiza status para error
            await this.update(id, { 
                status: 'error',
                error_message: error.message
            });

            throw error;
        }
    }
}

module.exports = TaskService;
