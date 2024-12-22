const ContactController = require('./contact.controller');
const ContactService = require('./contact.service');
const ContactRepository = require('./contact.repository');
const contactRoutes = require('./contact.routes');

class ContactModule {
    static register(app) {
        const contactRepository = new ContactRepository();
        const contactService = new ContactService({ contactRepository });
        const contactController = new ContactController(contactService);

        // Registra as rotas de contatos
        app.use('/api/contacts', contactRoutes(contactController));
    }
}

module.exports = ContactModule;
