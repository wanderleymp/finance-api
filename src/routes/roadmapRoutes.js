const express = require('express');
const router = express.Router();
const { 
  listTasks, 
  createTask, 
  updateTaskStatus,
  updateTaskDescription,
  updateTask 
} = require('../controllers/roadmapController');

// GET /roadmap - Listar tarefas
router.get('/', listTasks);

// POST /roadmap - Criar nova tarefa
router.post('/', createTask);

// PUT /roadmap/:id - Atualizar tarefa (PUT genérico)
router.put('/:id', updateTask);

module.exports = router;
