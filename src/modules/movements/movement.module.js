const MovementController = require('./movement.controller');
const MovementService = require('./movement.service');
const MovementRepository = require('./movement.repository');
const PersonRepository = require('../persons/person.repository');
const MovementTypeRepository = require('../movement-types/movement-type.repository');
const MovementStatusRepository = require('../movement-statuses/movement-status.repository');
const MovementPaymentRepository = require('../movement-payments/movement-payment.repository');
const PaymentMethodRepository = require('../payment-methods/payment-method.repository');
const InstallmentRepository = require('../installments/installment.repository');
const MovementPaymentService = require('../movement-payments/movement-payment.service');
const BoletoService = require('../boletos/boleto.service');
const BoletoRepository = require('../boletos/boleto.repository');
const TaskService = require('../tasks/task.service');
const TaskRepository = require('../../repositories/taskRepository');
const n8nService = require('../../services/n8n.service');
const CacheService = require('../../services/cache.service');
const { systemDatabase } = require('../../config/database');

// Instancia os repositórios
const personRepository = new PersonRepository();
const movementTypeRepository = new MovementTypeRepository();
const movementStatusRepository = new MovementStatusRepository();
const movementPaymentRepository = new MovementPaymentRepository();
const paymentMethodRepository = new PaymentMethodRepository();
const installmentRepository = new InstallmentRepository();
const repository = new MovementRepository(personRepository, movementTypeRepository, movementStatusRepository);
const boletoRepository = new BoletoRepository(systemDatabase.pool);
const taskRepository = new TaskRepository();
const cacheService = new CacheService('movements');

// Instancia os serviços auxiliares
const taskService = new TaskService({ taskRepository });
const boletoService = new BoletoService({ 
    boletoRepository,
    n8nService,
    taskService,
    cacheService
});

// Instancia o MovementPaymentService
const movementPaymentService = new MovementPaymentService({ 
    movementPaymentRepository,
    cacheService,
    installmentRepository,
    boletoService
});

// Instancia o serviço principal
const service = new MovementService({ 
    movementRepository: repository,
    cacheService,
    pool: systemDatabase.pool,
    movementPaymentRepository,
    paymentMethodRepository,
    installmentRepository,
    movementPaymentService
});

const controller = new MovementController({ movementService: service });

// Importa as rotas e passa o controller
const routes = require('./movement.routes')(controller);

module.exports = routes;
