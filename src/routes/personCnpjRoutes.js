const express = require('express');
const personCnpjController = require('../controllers/personCnpjController');
const { validateRequest } = require('../middlewares/requestValidator');
const personSchema = require('../schemas/personSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Middleware de autenticação
router.use(authMiddleware);

// Log para debug
router.use((req, res, next) => {
    console.log('Rota CNPJ acessada:', req.method, req.path);
    next();
});

// Rota para cadastro/atualização via CNPJ
router.post('/:cnpj', 
    validateRequest(personSchema.createPersonByCnpj, 'params'), 
    (req, res, next) => {
        req.body = { cnpj: req.params.cnpj };
        next();
    },
    personCnpjController.createOrUpdateByCnpj
);

module.exports = router;
