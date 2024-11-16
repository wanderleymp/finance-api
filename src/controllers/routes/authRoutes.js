// src/routes/authRoutes.js

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para registrar um novo usuário
router.post(
    '/register',
    [
        body('person_id').not().isEmpty().withMessage('ID da pessoa é obrigatório'),
        body('license_id').not().isEmpty().withMessage('ID da licença é obrigatório'),
        body('password').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres')
    ],
    authController.register
);

// Rota para fazer login
router.post(
    '/login',
    [
        body('person_id').not().isEmpty().withMessage('ID da pessoa é obrigatório'),
        body('password').not().isEmpty().withMessage('Senha é obrigatória')
    ],
    authController.login
);

module.exports = router;
