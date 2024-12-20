/**
 * Interface para o serviço de tarefas
 */
class ITaskService {
    /**
     * Cria uma nova tarefa
     * @param {Object} task - Dados da tarefa
     */
    async createTask(task) {
        throw new Error('Method not implemented');
    }

    /**
     * Atualiza o status de uma tarefa
     * @param {number} taskId - ID da tarefa
     * @param {string} status - Novo status
     */
    async updateTaskStatus(taskId, status) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista tarefas com filtros
     * @param {Object} filters - Filtros para busca
     */
    async findTasks(filters) {
        throw new Error('Method not implemented');
    }

    /**
     * Busca uma tarefa por ID
     * @param {number} taskId - ID da tarefa
     */
    async findTaskById(taskId) {
        throw new Error('Method not implemented');
    }
}

module.exports = ITaskService;
