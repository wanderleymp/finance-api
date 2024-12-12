const express = require('express');
const { getRoadmapTasks } = require('../controllers/roadmapController');
const { logger } = require('../middlewares/logger');

const router = express.Router();

// Endpoint para consultar tarefas do roadmap
router.get('/', async (req, res) => {
  try {
    // Extrair parâmetros de filtro da query
    const { status } = req.query;

    // Buscar tarefas com filtro opcional
    const tasks = await getRoadmapTasks(status);

    // Registrar a consulta
    logger.info('Consulta de tarefas do roadmap', {
      status: status || 'todos',
      totalTasks: tasks.length,
      action: 'get_roadmap_tasks'
    });

    // Retornar tarefas
    res.status(200).json({
      status: 'success',
      total: tasks.length,
      tasks: tasks
    });
  } catch (error) {
    // Registrar erro
    logger.error('Erro ao buscar tarefas do roadmap', {
      error: error.message,
      action: 'get_roadmap_tasks_error'
    });

    // Resposta de erro
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar tarefas do roadmap',
      error: error.message
    });
  }
});

module.exports = router;
