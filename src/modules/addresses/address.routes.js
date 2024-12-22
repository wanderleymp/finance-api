const express = require('express');
const { authMiddleware } = require('../../middlewares/auth');

module.exports = (addressController) => {
    const router = express.Router();

    // Rotas protegidas por autenticação
    router.use(authMiddleware);

    // Buscar todos os endereços
    router.get('/', 
        (req, res) => {
            console.log('Controller:', addressController);
            console.log('findAll method:', addressController.findAll);
            return addressController.findAll(req, res);
        }
    );

    // Buscar endereço por ID
    router.get('/:id', 
        (req, res) => addressController.findById(req, res)
    );

    // Buscar endereços de uma pessoa
    router.get('/person/:personId', 
        (req, res) => addressController.findByPersonId(req, res)
    );

    // Buscar endereço principal de uma pessoa
    router.get('/person/:personId/main', 
        (req, res) => addressController.findMainAddressByPersonId(req, res)
    );

    // Criar novo endereço
    router.post('/', 
        (req, res) => addressController.create(req, res)
    );

    // Atualizar endereço
    router.put('/:id', 
        (req, res) => addressController.update(req, res)
    );

    // Deletar endereço
    router.delete('/:id', 
        (req, res) => addressController.delete(req, res)
    );

    return router;
};
