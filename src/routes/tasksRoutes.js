const express = require('express');
const tasksController = require('../controllers/tasksController');
const { validateRequest } = require('../middlewares/requestValidator');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Listar todas as tarefas com filtros
router.get('/', tasksController.index);

// Buscar tarefa por ID
router.get('/:id', tasksController.show);

// Listar tarefas por tipo
router.get('/type/:type', tasksController.listByType);

// Listar tipos de tarefas
router.get('/types/list', tasksController.listTypes);

module.exports = router;
