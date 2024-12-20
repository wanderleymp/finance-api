const { createContainer, asClass, asValue, asFunction, InjectionMode } = require('awilix');
const { logger } = require('../middlewares/logger');
const cacheService = require('../services/cache.service');

// Repositories
const BoletoRepository = require('../repositories/boletoRepository');
const InstallmentRepository = require('../repositories/installmentRepository');
const MovementPaymentsRepository = require('../repositories/movementPaymentsRepository');
const MovementRepository = require('../repositories/movementRepository');
const TaskRepository = require('../repositories/taskRepository');

// Services
const BoletoService = require('../modules/boletos/boleto.service');
const InstallmentService = require('../modules/installments/installment.service');
const MovementPaymentService = require('../modules/movement-payments/movement-payment.service');
const MovementService = require('../modules/movements/movement.service');
const TaskService = require('../modules/tasks/task.service');

// Controllers
const BoletoController = require('../modules/boletos/boleto.controller');
const InstallmentController = require('../modules/installments/installment.controller');
const MovementPaymentController = require('../modules/movement-payments/movement-payment.controller');
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
    boletoRepository: asClass(BoletoRepository).singleton(),
    installmentRepository: asClass(InstallmentRepository).singleton(),
    movementPaymentsRepository: asClass(MovementPaymentsRepository).singleton(),
    movementRepository: asClass(MovementRepository).singleton(),
    taskRepository: asClass(TaskRepository).singleton(),

    // Services
    boletoService: asClass(BoletoService).singleton(),
    installmentService: asClass(InstallmentService).singleton(),
    movementPaymentService: asClass(MovementPaymentService).singleton(),
    movementService: asClass(MovementService).singleton(),
    taskService: asClass(TaskService).singleton(),

    // Controllers
    boletoController: asClass(BoletoController).singleton(),
    installmentController: asClass(InstallmentController).singleton(),
    movementPaymentController: asClass(MovementPaymentController).singleton(),
    movementController: asClass(MovementController).singleton(),

    // Processors
    boletoProcessor: asClass(BoletoProcessor).singleton()
});

module.exports = container;
