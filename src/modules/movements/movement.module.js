const MovementController = require('./movement.controller');
const MovementService = require('./movement.service');
const MovementRepository = require('./movement.repository');
const CacheService = require('../../services/cache.service');

// Instancia as dependências
const repository = new MovementRepository();
const cacheService = new CacheService('movements');
const service = new MovementService({ 
    movementRepository: repository,
    cacheService 
});
const controller = new MovementController({ movementService: service });

// Importa as rotas e passa o controller
const routes = require('./movement.routes')(controller);

module.exports = routes;
