const PersonContactRoutes = require('./person-contact.routes');
const PersonContactService = require('./person-contact.service');
const PersonContactController = require('./person-contact.controller');

class PersonContactModule {
    constructor() {
        this.routes = PersonContactRoutes;
        this.service = PersonContactService;
        this.controller = PersonContactController;
    }

    registerRoutes(app) {
        app.use('/person-contacts', this.routes.getRouter());
    }
}

module.exports = new PersonContactModule();
