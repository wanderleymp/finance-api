const express = require('express');
const userController = require('./user.controller');
const { validateRequest } = require('../../middlewares/requestValidator');
const authMiddleware = require('../../middlewares/authMiddleware');
const userSchema = require('./schemas/user.schema');

const router = express.Router();

// Rotas públicas (não requerem autenticação)
router.post('/register',
    validateRequest(userSchema.create),
    userController.create
);

// Rotas que requerem autenticação
router.use(authMiddleware);

router.get('/', 
    validateRequest(userSchema.list, 'query'),
    userController.list
);

router.get('/:id',
    validateRequest(userSchema.getById, 'params'),
    userController.getById
);

router.put('/:id',
    validateRequest(userSchema.update),
    userController.update
);

router.delete('/:id',
    validateRequest(userSchema.delete, 'params'),
    userController.delete
);

module.exports = router;
