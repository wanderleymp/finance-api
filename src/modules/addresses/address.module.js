const AddressController = require('./address.controller');
const AddressService = require('./address.service');
const AddressRepository = require('./address.repository');
const cacheService = require('../../services/cacheService');

// Instancia as dependências
const repository = new AddressRepository();
const service = new AddressService({ 
    addressRepository: repository,
    cacheService 
});
const controller = new AddressController(service);

// Importa as rotas e passa o controller
const routes = require('./address.routes')(controller);

module.exports = routes;
