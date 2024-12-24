class TaskDependenciesResponseDTO {
    constructor(data) {
        this.dependency_id = data.dependency_id;
        this.task_id = data.task_id;
        this.depends_on_task_id = data.depends_on_task_id;
        this.condition = data.condition;
        this.active = data.active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;

        // Informações da task dependente (se fornecidas)
        if (data.dependent_task) {
            this.dependent_task = {
                task_id: data.dependent_task.task_id,
                name: data.dependent_task.name,
                type_id: data.dependent_task.type_id,
                status: data.dependent_task.status
            };
        }
    }

    static toList(items) {
        return items.map(item => new TaskDependenciesResponseDTO(item));
    }
}

module.exports = TaskDependenciesResponseDTO;
