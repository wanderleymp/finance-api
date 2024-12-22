const PersonDocumentController = require('./person-document.controller');
const PersonDocumentService = require('./person-document.service');
const PersonDocumentRepository = require('./person-document.repository');
const personDocumentRoutes = require('./person-document.routes');

class PersonDocumentModule {
    static register(app) {
        const personDocumentRepository = new PersonDocumentRepository();
        const personDocumentService = new PersonDocumentService(personDocumentRepository);
        const personDocumentController = new PersonDocumentController(personDocumentService);

        // Registra as rotas de documentos
        app.use('/person-documents', personDocumentRoutes(personDocumentController));
    }
}

module.exports = PersonDocumentModule;
