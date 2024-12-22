const express = require('express');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @param {ContactController} contactController 
 */
module.exports = (contactController) => {
    const router = express.Router();

    // Rotas protegidas por autenticação
    router.use(authMiddleware);

    // Buscar todos os contatos
    router.get('/', 
        (req, res) => contactController.findAll(req, res)
    );

    // Buscar contato por ID
    router.get('/:id', 
        (req, res) => contactController.findById(req, res)
    );

    // Buscar contatos de uma pessoa
    router.get('/person/:personId', 
        (req, res) => contactController.findByPersonId(req, res)
    );

    // Criar novo contato
    router.post('/', 
        (req, res) => contactController.create(req, res)
    );

    // Atualizar contato
    router.put('/:id', 
        (req, res) => contactController.update(req, res)
    );

    // Deletar contato
    router.delete('/:id', 
        (req, res) => contactController.delete(req, res)
    );

    return router;
};
