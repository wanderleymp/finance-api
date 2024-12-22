const express = require('express');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const { createPersonDocumentSchema, updatePersonDocumentSchema } = require('./schemas/person-document.schema');

/**
 * @param {PersonDocumentController} controller 
 */
module.exports = (controller) => {
    const router = express.Router();

    // Rotas protegidas por autenticação
    router.use(authMiddleware);

    // Lista todos os documentos com paginação
    router.get('/', 
        (req, res) => controller.findAll(req, res)
    );
    
    // Busca um documento específico
    router.get('/:id', 
        (req, res) => controller.findById(req, res)
    );
    
    // Lista documentos de uma pessoa específica
    router.get('/person/:personId', 
        (req, res) => controller.findByPersonId(req, res)
    );
    
    // Cria um novo documento para uma pessoa
    router.post('/:personId', 
        (req, res, next) => validateSchema(createPersonDocumentSchema, req.body)
            .then(validatedData => {
                req.body = validatedData;
                next();
            })
            .catch(next),
        (req, res) => controller.create(req, res)
    );
    
    // Atualiza um documento
    router.put('/:id', 
        (req, res, next) => validateSchema(updatePersonDocumentSchema, req.body)
            .then(validatedData => {
                req.body = validatedData;
                next();
            })
            .catch(next),
        (req, res) => controller.update(req, res)
    );
    
    // Remove um documento
    router.delete('/:id', 
        (req, res) => controller.delete(req, res)
    );

    return router;
};
