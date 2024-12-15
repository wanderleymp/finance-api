const express = require('express');
const router = express.Router();
const { 
  listTasks, 
  createTask, 
  updateTaskStatus,
  updateTaskDescription,
  updateTask 
} = require('../controllers/roadmapController');
const authMiddleware = require('../middlewares/authMiddleware');

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// GET /roadmap - Listar tarefas
router.get('/', listTasks);

// POST /roadmap - Criar nova tarefa
router.post('/', createTask);

// PUT /roadmap/:id - Atualizar tarefa (PUT genérico)
router.put('/:id', updateTask);

module.exports = router;
