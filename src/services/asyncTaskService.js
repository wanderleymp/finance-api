const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const RabbitMQService = require('./rabbitMQService');

class AsyncTaskService {
  /**
   * Busca o ID do processo padrão para boleto
   * @returns {Promise<number>}
   */
  static async getDefaultBoletoProcessId() {
    const process = await prisma.processes.findFirst({
      where: { name: 'Geração de Boleto' },
      select: { process_id: true }
    });

    if (!process) {
      throw new Error('Processo padrão de Boleto não encontrado');
    }

    return process.process_id;
  }

  /**
   * Busca o status padrão de tarefa pendente
   * @returns {Promise<number>}
   */
  static async getDefaultPendingStatusId() {
    const status = await prisma.tasks_status.findFirst({
      where: { name: 'PENDING' },
      select: { status_id: true }
    });

    if (!status) {
      throw new Error('Status padrão de tarefa pendente não encontrado');
    }

    return status.status_id;
  }

  /**
   * Busca o modo de execução padrão
   * @returns {Promise<number>}
   */
  static async getDefaultExecutionModeId() {
    const mode = await prisma.tasks_execution_mode.findFirst({
      where: { is_default: true },
      select: { execution_mode_id: true }
    });

    if (!mode) {
      throw new Error('Modo de execução padrão não encontrado');
    }

    return mode.execution_mode_id;
  }

  /**
   * Cria uma tarefa assíncrona para geração de boleto
   * @param {number} movementId 
   * @param {Date} scheduledFor - Data agendada para execução
   * @param {number} previousTaskId - ID da tarefa anterior para dependência
   * @returns {Promise<Object>} Tarefa criada
   */
  static async createBoletoTask(movementId, scheduledFor = null, previousTaskId = null) {
    try {
      const processId = await this.getDefaultBoletoProcessId();
      const statusId = await this.getDefaultPendingStatusId();
      const executionModeId = await this.getDefaultExecutionModeId();

      const task = await prisma.tasks.create({
        data: {
          process_id: processId,
          name: `Geração de Boleto - Movimento ${movementId}`,
          description: `Tarefa de geração de boleto para movimento ${movementId}`,
          status_id: statusId,
          execution_mode_id: executionModeId,
          schedule: scheduledFor,
          metadata: JSON.stringify({ movementId }) // Adiciona metadados
        }
      });

      // Adiciona dependência se houver tarefa anterior
      if (previousTaskId) {
        await prisma.task_dependencies.create({
          data: {
            task_id: task.task_id,
            depends_on: previousTaskId
          }
        });
      }

      return task;
    } catch (error) {
      console.error(`Erro ao criar tarefa de boleto para movimento ${movementId}:`, error);
      throw error;
    }
  }

  /**
   * Publica tarefa no RabbitMQ
   * @param {Object} task 
   */
  static async publishTask(task) {
    await RabbitMQService.publishTask(task);
    console.log('Tarefa publicada:', task);
  }

  /**
   * Verifica se uma tarefa pode ser executada
   * @param {Object} task 
   * @returns {Promise<boolean>}
   */
  static async canExecuteTask(task) {
    const dependencies = await prisma.task_dependencies.findMany({
      where: { task_id: task.task_id }
    });

    if (dependencies.length === 0) return true;

    const dependencyTasks = await prisma.tasks.findMany({
      where: { 
        task_id: { in: dependencies.map(d => d.depends_on) } 
      }
    });

    return dependencyTasks.every(dep => dep.status_id === 3); // Assumindo que 3 é o status de COMPLETED
  }

  /**
   * Agenda múltiplas tarefas com dependências
   * @param {Array<Object>} taskConfigs 
   * @returns {Promise<Array<Object>>}
   */
  static async scheduleTaskChain(taskConfigs) {
    const tasks = [];
    let previousTaskId = null;

    try {
      for (const config of taskConfigs) {
        const task = await this.createBoletoTask(
          config.movementId, 
          config.scheduledFor, 
          previousTaskId
        );
        
        tasks.push(task);
        previousTaskId = task.task_id;
      }

      return tasks;
    } catch (error) {
      console.error('Erro ao agendar cadeia de tarefas:', error);
      
      // Tenta reverter tarefas já criadas
      for (const task of tasks) {
        try {
          await prisma.tasks.delete({ where: { task_id: task.task_id } });
        } catch (deleteError) {
          console.error(`Erro ao reverter tarefa ${task.task_id}:`, deleteError);
        }
      }

      throw error;
    }
  }

  /**
   * Registra log de tarefa
   * @param {number} taskId 
   * @param {string} message 
   * @param {number} statusId 
   */
  static async logTaskExecution(taskId, message, statusId) {
    await prisma.task_logs.create({
      data: {
        task_id: taskId,
        status_id: statusId,
        message: message
      }
    });
  }
}

module.exports = AsyncTaskService;
