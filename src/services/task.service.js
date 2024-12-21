class TaskService {
    async createTask(type, data) {
        // Implementação real aqui
        return {
            id: Math.random(),
            type,
            data,
            status: 'pending'
        };
    }
}

module.exports = TaskService;
