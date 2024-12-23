const express = require('express');
const router = express.Router();
const UserController = require("./user.controller");
const { userValidator } = require('./validators/user.validator');
const { authMiddleware } = require('../../middlewares/auth');

// Rotas públicas
router.post('/refresh', userValidator.refresh, UserController.refreshToken);

// Rotas protegidas
router.use(authMiddleware);

router.post('/', userValidator.create, UserController.create);
router.get('/', userValidator.list, UserController.list);
router.get('/:id', userValidator.getById, UserController.getById);
router.put('/:id', userValidator.update, UserController.update);
router.delete('/:id', userValidator.delete, UserController.delete);

module.exports = router;
