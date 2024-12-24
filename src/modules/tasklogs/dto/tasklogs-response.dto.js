class TaskLogsResponseDTO {
    constructor(data) {
        this.log_id = data.log_id;
        this.task_id = data.task_id;
        this.status = data.status;
        this.execution_time = data.execution_time;
        this.error_message = data.error_message;
        this.metadata = data.metadata;
        this.retries = data.retries;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;

        // Informações da task (se fornecidas)
        if (data.task) {
            this.task = {
                task_id: data.task.task_id,
                name: data.task.name,
                type_id: data.task.type_id,
                status: data.task.status
            };
        }
    }

    static toList(items) {
        return items.map(item => new TaskLogsResponseDTO(item));
    }
}

module.exports = TaskLogsResponseDTO;
