const roadmapRepository = require('../repositories/roadmapRepository');
const { logger } = require('../middlewares/logger');

class RoadmapService {
  // Listar tarefas com filtro
  async listTasks(status = null) {
    try {
      const tasks = await roadmapRepository.findAll(status);
      
      logger.info('Tarefas do roadmap listadas', {
        totalTasks: tasks.length,
        status: status || 'todos',
        action: 'list_roadmap_tasks'
      });

      return tasks;
    } catch (error) {
      logger.error('Erro ao listar tarefas do roadmap', {
        error: error.message,
        status,
        action: 'list_roadmap_tasks_error'
      });
      throw error;
    }
  }

  // Criar nova tarefa
  async createTask(title, description, status = 'pendente') {
    try {
      // Validações de entrada
      if (!title) {
        throw new Error('Título da tarefa é obrigatório');
      }

      const task = await roadmapRepository.create(title, description, status);
      
      logger.info('Nova tarefa criada no roadmap', {
        task,
        action: 'create_roadmap_task'
      });

      return task;
    } catch (error) {
      logger.error('Erro ao criar tarefa no roadmap', {
        error: error.message,
        title,
        action: 'create_roadmap_task_error'
      });
      throw error;
    }
  }

  // Atualizar status da tarefa
  async updateTaskStatus(id, status) {
    try {
      // Validações de entrada
      if (!id) {
        throw new Error('ID da tarefa é obrigatório');
      }

      // Verificar se a tarefa existe
      const existingTask = await roadmapRepository.findById(id);
      if (!existingTask) {
        throw new Error('Tarefa não encontrada');
      }

      // Lista de status válidos
      const validStatus = ['pendente', 'em progresso', 'concluído'];
      if (!validStatus.includes(status)) {
        throw new Error(`Status inválido. Use: ${validStatus.join(', ')}`);
      }

      const updatedTask = await roadmapRepository.updateStatus(id, status);
      
      logger.info('Status da tarefa atualizado', {
        task: updatedTask,
        action: 'update_roadmap_task_status'
      });

      return updatedTask;
    } catch (error) {
      logger.error('Erro ao atualizar status da tarefa', {
        error: error.message,
        id,
        status,
        action: 'update_roadmap_task_status_error'
      });
      throw error;
    }
  }

  // Atualizar descrição da tarefa
  async updateTaskDescription(id, description) {
    try {
      // Validações de entrada
      if (!id) {
        throw new Error('ID da tarefa é obrigatório');
      }

      if (!description || description.trim() === '') {
        throw new Error('Descrição da tarefa não pode ser vazia');
      }

      // Verificar se a tarefa existe
      const existingTask = await roadmapRepository.findById(id);
      if (!existingTask) {
        throw new Error('Tarefa não encontrada');
      }

      const updatedTask = await roadmapRepository.updateDescription(id, description);
      
      logger.info('Descrição da tarefa atualizada', {
        task: updatedTask,
        action: 'update_roadmap_task_description'
      });

      return updatedTask;
    } catch (error) {
      logger.error('Erro ao atualizar descrição da tarefa', {
        error: error.message,
        id,
        description,
        action: 'update_roadmap_task_description_error'
      });
      throw error;
    }
  }

  // Atualizar tarefa
  async updateTask(id, updateData) {
    try {
      // Validações de entrada
      if (!id) {
        throw new Error('ID da tarefa é obrigatório');
      }

      // Campos permitidos para atualização
      const allowedFields = ['title', 'description', 'status'];
      const filteredData = {};

      // Filtrar e validar campos
      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          // Validações específicas por campo
          if (field === 'title' && (!updateData.title || updateData.title.trim() === '')) {
            throw new Error('Título da tarefa não pode ser vazio');
          }

          if (field === 'description' && (!updateData.description || updateData.description.trim() === '')) {
            throw new Error('Descrição da tarefa não pode ser vazia');
          }

          if (field === 'status') {
            const validStatus = ['pendente', 'em progresso', 'concluído'];
            if (!validStatus.includes(updateData.status)) {
              throw new Error(`Status inválido. Use: ${validStatus.join(', ')}`);
            }
          }

          filteredData[field] = updateData[field];
        }
      }

      // Verificar se há campos para atualizar
      if (Object.keys(filteredData).length === 0) {
        throw new Error('Nenhum campo válido para atualização');
      }

      // Verificar se a tarefa existe
      const existingTask = await roadmapRepository.findById(id);
      if (!existingTask) {
        throw new Error('Tarefa não encontrada');
      }

      const updatedTask = await roadmapRepository.update(id, filteredData);
      
      logger.info('Tarefa atualizada', {
        task: updatedTask,
        action: 'update_roadmap_task'
      });

      return updatedTask;
    } catch (error) {
      logger.error('Erro ao atualizar tarefa', {
        error: error.message,
        id,
        updateData,
        action: 'update_roadmap_task_error'
      });
      throw error;
    }
  }
}

module.exports = new RoadmapService();
