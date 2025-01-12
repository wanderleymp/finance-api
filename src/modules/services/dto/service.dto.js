class ServiceDTO {
    constructor(data) {
        this.service_id = data.service_id;
        this.item_id = data.item_id;
        this.service_group_id = data.service_group_id;
        this.description = data.description;
        this.active = data.active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.deleted_at = data.deleted_at;
    }

    /**
     * Converte dados do banco para DTO
     * @param {Object} data - Dados do banco
     * @returns {ServiceDTO} Instância de ServiceDTO
     */
    static fromDatabase(data) {
        return new ServiceDTO(data);
    }

    /**
     * Converte DTO para payload de criação/atualização
     * @returns {Object} Payload para banco de dados
     */
    toDatabase() {
        const payload = {
            item_id: this.item_id,
            service_group_id: this.service_group_id,
            description: this.description,
            active: this.active
        };

        // Remove chaves com valor undefined
        Object.keys(payload).forEach(key => 
            payload[key] === undefined && delete payload[key]
        );

        return payload;
    }

    /**
     * Valida dados do serviço
     * @returns {boolean} True se dados são válidos
     */
    validate() {
        if (!this.item_id) {
            throw new Error('Item ID é obrigatório');
        }

        if (this.active === undefined) {
            this.active = true;
        }

        return true;
    }
}

module.exports = ServiceDTO;
