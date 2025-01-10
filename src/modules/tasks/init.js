const { logger } = require('../../middlewares/logger');
const TaskWorker = require('./workers/task.worker');
const BoletoProcessor = require('./processors/boleto.processor');
const TaskService = require('./task.service');
const BoletoService = require('../boletos/boleto.service');
const TaskRepository = require('./repositories/task.repository');
const TaskTypesRepository = require('./repositories/task-types.repository');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');
const BoletoRepository = require('../boletos/boleto.repository');
const n8nService = require('../../services/n8n.service');

function initializeTaskWorker() {
    try {
        // Instanciar repositórios
        const taskRepository = new TaskRepository();
        const taskTypesRepository = new TaskTypesRepository();
        const boletoRepository = new BoletoRepository();
        
        // Instanciar serviços
        const taskLogsService = new TaskLogsService();
        const taskDependenciesService = new TaskDependenciesService();
        
        // Criar TaskService com todas as dependências
        const taskService = new TaskService({
            taskRepository,
            taskLogsService,
            taskDependenciesService,
            taskTypesRepository
        });

        // Criar BoletoService com suas dependências
        const boletoService = new BoletoService({
            boletoRepository,
            n8nService,  // Usando a instância singleton do N8NService
            taskService
        });

        // Criar worker
        const worker = new TaskWorker({ taskService });

        // Criar e registrar processadores
        const boletoProcessor = new BoletoProcessor(taskService, boletoService);
        worker.registerProcessor(boletoProcessor);

        // Iniciar worker
        worker.start();

        logger.info('TaskWorker inicializado com sucesso', {
            availableProcessors: Array.from(worker.processors.keys())
        });

        return worker;
    } catch (error) {
        logger.error('Erro ao inicializar TaskWorker', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

module.exports = {
    initializeTaskWorker
};
