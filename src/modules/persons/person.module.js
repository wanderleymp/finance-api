const PersonRoutes = require('./person.routes');
const PersonController = require('./person.controller');
const PersonService = require('./person.service');
const PersonRepository = require('./person.repository');

class PersonModule {
    constructor() {
        this.repository = new PersonRepository();
        this.service = new PersonService({ 
            personRepository: this.repository 
        });
        this.controller = new PersonController(this.service);
        this.routes = PersonRoutes;
    }

    register(app) {
        app.use('/api/persons', this.routes.getRouter());
    }
}

module.exports = new PersonModule();
