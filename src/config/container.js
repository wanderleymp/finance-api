const { createContainer, asClass, asValue, InjectionMode } = require('awilix');
const { logger } = require('../middlewares/logger');

// Importações de repositórios e serviços necessários
const TaskService = require('../modules/tasks/task.service');
const TaskLogsService = require('../modules/tasks/services/task-logs.service');
const TaskDependenciesService = require('../modules/taskdependencies/taskdependencies.service');
const TaskRepository = require('../modules/tasks/repositories/task.repository');
const TaskTypesRepository = require('../modules/tasktypes/tasktypes.repository');
const NfseService = require('../modules/nfse/nfse.service');
const NfseRepository = require('../modules/nfse/nfse.repository');

// Importar pool de banco de dados
const { systemDatabase } = require('./database');

// Criar container
const container = createContainer({
    injectionMode: InjectionMode.PROXY
});

// Registrar dependências
container.register({
    // Infraestrutura
    logger: asValue(logger),
    systemDatabase: asValue(systemDatabase),

    // Repositórios
    taskRepository: asClass(TaskRepository).singleton(),
    taskTypesRepository: asClass(TaskTypesRepository).singleton(),
    nfseRepository: asClass(NfseRepository).singleton(),

    // Serviços essenciais
    taskService: asClass(TaskService).singleton(),
    taskLogsService: asClass(TaskLogsService).singleton(),
    taskDependenciesService: asClass(TaskDependenciesService).singleton(),
    nfseService: asClass(NfseService).singleton()
});

module.exports = container;
