const express = require('express');
const personDocumentController = require('../controllers/personDocumentController');
const { validateRequest } = require('../middlewares/requestValidator');
const personDocumentSchema = require('../schemas/personDocumentSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Listar documentos
router.get('/', personDocumentController.index);

// Obter documento por ID
router.get('/:id', 
    validateRequest(personDocumentSchema.getDocumentById, 'params'), 
    personDocumentController.show
);

// Criar novo documento
router.post('/', 
    validateRequest(personDocumentSchema.createDocument, 'body'), 
    personDocumentController.store
);

// Atualizar documento
router.put('/:id', 
    validateRequest(personDocumentSchema.getDocumentById, 'params'),
    validateRequest(personDocumentSchema.updateDocument, 'body'), 
    personDocumentController.update
);

// Excluir documento
router.delete('/:id', 
    validateRequest(personDocumentSchema.getDocumentById, 'params'), 
    personDocumentController.delete
);

// Listar documentos de uma pessoa específica
router.get('/person/:personId', personDocumentController.getPersonDocuments);

module.exports = router;
