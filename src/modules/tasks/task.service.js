const { logger } = require('../../middlewares/logger');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');

class TaskService {
    constructor({ taskRepository, taskLogsService, taskDependenciesService, taskTypesRepository }) {
        this.repository = taskRepository;
        // Garante que logsService seja uma instância de TaskLogsService
        this.logsService = taskLogsService instanceof TaskLogsService 
            ? taskLogsService 
            : new TaskLogsService();
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
                payload: JSON.stringify(data.payload),
                name: data.name,
                description: data.description
            });

            console.log('DEBUG TaskService: Dados da task', { 
                taskType: data.type,
                payload: JSON.stringify(data.payload),
                name: data.name,
                description: data.description
            });

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
                throw new Error(`Tipo de tarefa "${data.type}" não encontrado no mapeamento`);
            }

            logger.info('TaskService: Tipo de task identificado', { 
                taskType: data.type,
                taskTypeId 
            });

            // Prepara dados da task
            const taskData = {
                type_id: taskTypeId,
                name: data.name || this.generateTaskName(data.type, data.payload),
                status: 'pending',
                payload: JSON.stringify(data.payload),
                created_at: new Date(),
                updated_at: new Date()
            };

            logger.info('TaskService: Dados da task preparados', { taskData });

            // Cria task
            const result = await this.repository.create(taskData);

            if (!result || !result.task_id) {
                logger.error('TaskService: Falha na criação da tarefa', {
                    taskData: JSON.stringify(taskData),
                    repositoryMethod: !!this.repository.create,
                    repositoryInstance: !!this.repository
                });
                throw new Error('Falha ao criar tarefa: resultado inválido');
            }

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
            logger.error('TaskService: Erro crítico ao criar task', {
                error: error.message,
                errorStack: error.stack,
                taskType: data.type,
                payload: JSON.stringify(data.payload),
                repository: !!this.repository,
                logsService: !!this.logsService
            });
            throw error;
        }
    }

    generateTaskName(type, payload) {
        switch (type) {
            case 'email':
                return `Email para ${payload.to || 'destinatário'}`;
            case 'boleto':
                return `Boleto ${payload.billing?.boleto_id || 'sem número'}`;
            case 'nfse':
                return `NFSE ${payload.serviceDescription || 'sem descrição'}`;
            case 'backup':
                return `Backup ${new Date().toISOString().split('T')[0]}`;
            case 'sync':
                return `Sincronização ${payload.entityType || 'geral'}`;
            default:
                return `Task ${type} ${new Date().getTime()}`;
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
            logger.info('Iniciando processamento de task', { 
                id,
                logsService: this.logsService ? Object.keys(this.logsService) : 'Sem logsService'
            });

            // Verifica se logsService tem o método create
            if (!this.logsService || typeof this.logsService.create !== 'function') {
                logger.error('Método create não encontrado no logsService', { 
                    logsService: this.logsService,
                    logsServiceType: typeof this.logsService,
                    logsServiceKeys: this.logsService ? Object.keys(this.logsService) : 'N/A'
                });
                throw new Error('Serviço de logs não configurado corretamente');
            }

            // Busca a task
            const task = await this.repository.findById(id);
            if (!task) {
                throw new Error('Task não encontrada');
            }

            logger.debug('Task encontrada', { 
                task,
                payload: task.payload
            });

            // Atualiza status para running
            await this.repository.update(id, { status: 'running' });

            // Cria log de início de processamento
            await this.logsService.create({
                task_id: id,
                status: 'running',
                metadata: { action: 'process_start' }
            });

            // Processa a task baseado no tipo
            const payload = JSON.parse(task.payload);
            
            logger.info('Processando payload da task', { 
                taskId: id, 
                taskType: task.type_id, 
                payloadType: typeof payload 
            });

            // Lógica de processamento específica (a ser implementada)
            // Por exemplo:
            // switch(task.type_id) {
            //     case 1: // boleto
            //         await this.processBoletotask(payload);
            //         break;
            //     case 3: // email
            //         await this.processEmailTask(payload);
            //         break;
            //     default:
            //         throw new Error(`Tipo de task não suportado: ${task.type_id}`);
            // }

            // Atualiza status para completed
            await this.repository.update(id, { status: 'completed' });

            // Cria log de conclusão
            await this.logsService.create({
                task_id: id,
                status: 'completed',
                metadata: { action: 'process_end' }
            });

            logger.info('Task processada com sucesso', { id });

            return true;
        } catch (error) {
            logger.error('Erro ao processar task', {
                error: error.message,
                errorStack: error.stack,
                id
            });

            // Atualiza status para error
            await this.repository.update(id, { 
                status: 'error',
                error_message: error.message
            });

            // Cria log de erro
            try {
                await this.logsService.create({
                    task_id: id,
                    status: 'error',
                    metadata: { 
                        action: 'process_error',
                        error_message: error.message
                    }
                });
            } catch (logError) {
                logger.error('Erro ao criar log de erro', {
                    originalError: error.message,
                    logError: logError.message
                });
            }

            throw error;
        }
    }
}

module.exports = TaskService;
