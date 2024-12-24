class TaskTypesResponseDTO {
    constructor(data) {
        this.type_id = data.type_id;
        this.name = data.name;
        this.description = data.description;
        this.max_retries = data.max_retries;
        this.retry_delay_seconds = data.retry_delay_seconds;
        this.timeout_seconds = data.timeout_seconds;
        this.active = data.active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static toList(items) {
        return items.map(item => new TaskTypesResponseDTO(item));
    }
}

module.exports = TaskTypesResponseDTO;
