const roadmapService = require('../services/roadmapService');
const { logger } = require('../middlewares/logger');

// Listar tarefas
async function listTasks(req, res) {
  try {
    const { status } = req.query;
    const tasks = await roadmapService.listTasks(status);

    res.status(200).json({
      status: 'success',
      total: tasks.length,
      tasks: tasks
    });
  } catch (error) {
    logger.error('Erro ao listar tarefas do roadmap', {
      error: error.message,
      action: 'list_roadmap_tasks_error'
    });

    res.status(500).json({
      status: 'error',
      message: 'Erro ao listar tarefas do roadmap',
      error: error.message
    });
  }
}

// Criar nova tarefa
async function createTask(req, res) {
  try {
    const { title, description, status } = req.body;
    const task = await roadmapService.createTask(title, description, status);

    res.status(201).json({
      status: 'success',
      task: task
    });
  } catch (error) {
    logger.error('Erro ao criar tarefa no roadmap', {
      error: error.message,
      action: 'create_roadmap_task_error'
    });

    res.status(400).json({
      status: 'error',
      message: 'Erro ao criar tarefa no roadmap',
      error: error.message
    });
  }
}

// Atualizar status da tarefa
async function updateTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const task = await roadmapService.updateTaskStatus(id, status);

    res.status(200).json({
      status: 'success',
      task: task
    });
  } catch (error) {
    logger.error('Erro ao atualizar status da tarefa', {
      error: error.message,
      action: 'update_roadmap_task_status_error'
    });

    res.status(400).json({
      status: 'error',
      message: 'Erro ao atualizar status da tarefa',
      error: error.message
    });
  }
}

// Atualizar descrição da tarefa
async function updateTaskDescription(req, res) {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const task = await roadmapService.updateTaskDescription(id, description);

    res.status(200).json({
      status: 'success',
      task: task
    });
  } catch (error) {
    logger.error('Erro ao atualizar descrição da tarefa', {
      error: error.message,
      action: 'update_roadmap_task_description_error'
    });

    res.status(400).json({
      status: 'error',
      message: 'Erro ao atualizar descrição da tarefa',
      error: error.message
    });
  }
}

// Atualizar tarefa
async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const task = await roadmapService.updateTask(id, updateData);

    res.status(200).json({
      status: 'success',
      task: task
    });
  } catch (error) {
    logger.error('Erro ao atualizar tarefa', {
      error: error.message,
      action: 'update_roadmap_task_error'
    });

    res.status(400).json({
      status: 'error',
      message: 'Erro ao atualizar tarefa',
      error: error.message
    });
  }
}

module.exports = {
  listTasks,
  createTask,
  updateTaskStatus,
  updateTaskDescription,
  updateTask
};
