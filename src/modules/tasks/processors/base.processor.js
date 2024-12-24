const { logger } = require('../../../middlewares/logger');

class BaseProcessor {
    constructor(taskService) {
        if (this.constructor === BaseProcessor) {
            throw new Error('BaseProcessor é uma classe abstrata');
        }
        this.taskService = taskService;
    }

    // Retorna o tipo de task que este processador manipula
    getTaskType() {
        throw new Error('Método getTaskType deve ser implementado');
    }
    
    // Valida o payload antes do processamento
    async validatePayload(payload) {
        // Implementação padrão - pode ser sobrescrita
        return true;
    }
    
    // Processa a task
    async process(task) {
        throw new Error('Método process deve ser implementado');
    }
    
    // Lida com falhas (pode ser sobrescrito)
    async handleFailure(task, error) {
        logger.error(`${this.getTaskType()}: Erro no processamento`, {
            taskId: task.task_id,
            error: error.message,
            payload: task.payload
        });
    }
    
    // Verifica se pode tentar novamente (pode ser sobrescrito)
    async canRetry(task) {
        return task.retries < task.max_retries;
    }

    // Método helper para atualizar status
    async updateTaskStatus(taskId, status, errorMessage = null) {
        await this.taskService.update(taskId, {
            status,
            error_message: errorMessage
        });
    }
}

module.exports = BaseProcessor;
