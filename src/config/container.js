const { createContainer, asClass, asValue, asFunction, InjectionMode } = require('awilix');
const { logger } = require('../middlewares/logger');
const cacheService = require('../services/cache.service');

// Repositories
const PersonRepository = require('../modules/persons/person.repository');
const MovementRepository = require('../modules/movements/movement.repository');
const MovementTypeRepository = require('../modules/movement-types/movement-type.repository');
const MovementStatusRepository = require('../modules/movement-statuses/movement-status.repository');
const MovementPaymentRepository = require('../modules/movement-payments/movement-payment.repository');
const PaymentMethodRepository = require('../modules/payment-methods/payment-method.repository');
const InstallmentRepository = require('../modules/installments/installment.repository');
const BoletoRepository = require('../modules/boletos/boleto.repository');
const TaskRepository = require('../modules/tasks/repositories/task.repository');
const TaskLogsService = require('../modules/tasks/services/task-logs.service');
const TaskDependenciesService = require('../modules/taskdependencies/taskdependencies.service');
const TaskTypesRepository = require('../modules/tasktypes/tasktypes.repository');

// Services
const MovementPaymentService = require('../modules/movement-payments/movement-payment.service');
const BoletoService = require('../modules/boletos/boleto.service');
const InstallmentService = require('../modules/installments/installment.service');
const TaskService = require('../modules/tasks/task.service');
const MovementService = require('../modules/movements/movement.service');

// Controllers
const BoletoController = require('../modules/boletos/boleto.controller');
const InstallmentController = require('../modules/installments/installment.controller');
const MovementController = require('../modules/movements/movement.controller');

// Processors
const BoletoProcessor = require('../modules/boletos/boleto.processor');

// Criar container
const container = createContainer({
    injectionMode: InjectionMode.PROXY
});

// Registrar dependências
container.register({
    // Infraestrutura
    logger: asValue(logger),
    cacheService: asValue(cacheService),

    // Repositories
    personRepository: asClass(PersonRepository).singleton(),
    movementRepository: asClass(MovementRepository).singleton(),
    movementTypeRepository: asClass(MovementTypeRepository).singleton(),
    movementStatusRepository: asClass(MovementStatusRepository).singleton(),
    movementPaymentRepository: asClass(MovementPaymentRepository).singleton(),
    paymentMethodRepository: asClass(PaymentMethodRepository).singleton(),
    installmentRepository: asClass(InstallmentRepository).singleton(),
    boletoRepository: asClass(BoletoRepository).singleton(),
    taskRepository: asClass(TaskRepository).singleton(),
    taskTypesRepository: asClass(TaskTypesRepository).singleton(),

    // Services
    movementPaymentService: asClass(MovementPaymentService).singleton(),
    boletoService: asClass(BoletoService).singleton(),
    installmentService: asClass(InstallmentService).singleton(),
    taskService: asClass(TaskService).singleton(),
    taskLogsService: asClass(TaskLogsService).singleton(),
    taskDependenciesService: asClass(TaskDependenciesService).singleton(),
    movementService: asClass(MovementService).singleton(),

    // Controllers
    boletoController: asClass(BoletoController).singleton(),
    installmentController: asClass(InstallmentController).singleton(),
    movementController: asClass(MovementController).singleton(),

    // Processors
    boletoProcessor: asClass(BoletoProcessor).singleton()
});

module.exports = container;
