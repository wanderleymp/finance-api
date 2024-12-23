const MovementController = require('./movement.controller');
const MovementService = require('./movement.service');
const MovementRepository = require('./movement.repository');
const PersonRepository = require('../persons/person.repository');
const MovementTypeRepository = require('../movement-types/movement-type.repository');
const MovementStatusRepository = require('../movement-statuses/movement-status.repository');
const MovementPaymentRepository = require('../movement-payments/movement-payment.repository');
const PaymentMethodRepository = require('../payment-methods/payment-method.repository');
const InstallmentRepository = require('../installments/installment.repository');
const CacheService = require('../../services/cache.service');
const { systemDatabase } = require('../../config/database');

// Instancia as dependências
const personRepository = new PersonRepository();
const movementTypeRepository = new MovementTypeRepository();
const movementStatusRepository = new MovementStatusRepository();
const movementPaymentRepository = new MovementPaymentRepository();
const paymentMethodRepository = new PaymentMethodRepository();
const installmentRepository = new InstallmentRepository();
const repository = new MovementRepository(personRepository, movementTypeRepository, movementStatusRepository);
const cacheService = new CacheService('movements');

const service = new MovementService({ 
    movementRepository: repository,
    cacheService,
    pool: systemDatabase.pool,
    movementPaymentRepository,
    paymentMethodRepository,
    installmentRepository
});

const controller = new MovementController({ movementService: service });

// Importa as rotas e passa o controller
const routes = require('./movement.routes')(controller);

module.exports = routes;
