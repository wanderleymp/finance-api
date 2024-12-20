class TaskProcessor {
    // Retorna o nome do tipo de tarefa que este processador pode lidar
    getTaskType() {
        throw new Error('Método getTaskType deve ser implementado');
    }

    // Processa a tarefa
    async process(task) {
        throw new Error('Método process deve ser implementado');
    }
}

module.exports = TaskProcessor;
