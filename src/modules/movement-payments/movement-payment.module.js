const MovementPaymentController = require('./movement-payment.controller');
const MovementPaymentService = require('./movement-payment.service');
const MovementPaymentRepository = require('./movement-payment.repository');
const MovementRepository = require('../movements/movement.repository');
const PaymentMethodRepository = require('../payment-methods/payment-method.repository');
const InstallmentRepository = require('../installments/installment.repository');
const BoletoService = require('../boletos/boleto.service');
const BoletoRepository = require('../boletos/boleto.repository');
const TaskService = require('../tasks/services/task.service');
const TaskRepository = require('../tasks/repositories/task.repository');
const n8nService = require('../../services/n8n.service');
const cacheService = require('../../services/cache.service');
const { systemDatabase } = require('../../config/database');

// Instancia os repositórios
const repository = new MovementPaymentRepository();
const installmentRepository = new InstallmentRepository();
const boletoRepository = new BoletoRepository(systemDatabase.pool);
const taskRepository = new TaskRepository();

// Instancia os serviços auxiliares
const taskService = new TaskService({ taskRepository });
const boletoService = new BoletoService({ 
    boletoRepository,
    n8nService,
    taskService,
    cacheService
});

// Instancia o serviço principal
const service = new MovementPaymentService({ 
    movementPaymentRepository: repository,
    cacheService,
    installmentRepository,
    boletoService
});

const controller = new MovementPaymentController({ movementPaymentService: service });

// Importa as rotas e passa o controller
const routes = require('./movement-payment.routes')(controller);

module.exports = routes;
