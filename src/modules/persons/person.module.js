const PersonRepository = require('./person.repository');
const PersonService = require('./person.service');
const PersonController = require('./person.controller');

class PersonModule {
    static register(app) {
        const repository = new PersonRepository();
        const service = new PersonService({ personRepository: repository });
        const controller = new PersonController({ personService: service });

        // Registra as rotas
        app.use('/persons', controller.router);
    }
}

module.exports = PersonModule;
