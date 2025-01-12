class ServiceDTO {
    constructor(data) {
        this.service_id = data.service_id;
        this.item_id = data.item_id;
        this.service_group_id = data.service_group_id;
        this.description = data.description; // Descrição do item
        this.name = data.name; // Nome do item
        this.active = data.active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Converte dados do banco para DTO
     * @param {Object} data - Dados do banco
     * @returns {Object} Instância de ServiceDTO
     */
    static fromDatabase(data) {
        if (!data) return null;

        return {
            service_id: data.service_id,
            item_id: data.item_id,
            service_group_id: data.service_group_id,
            description: data.description, // Descrição do item
            name: data.name, // Nome do item
            item_name: data.item_name,
            item_description: data.item_description,
            service_group_name: data.service_group_name,
            active: data.active,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
    }

    /**
     * Converte DTO para payload de criação/atualização
     * @returns {Object} Payload para banco de dados
     */
    toDatabase() {
        const databaseData = {
            item_id: this.item_id,
            service_group_id: this.service_group_id,
            active: this.active !== undefined ? this.active : true
        };

        // Remover chaves com valor undefined
        Object.keys(databaseData).forEach(key => 
            databaseData[key] === undefined && delete databaseData[key]
        );

        return databaseData;
    }

    /**
     * Valida dados do serviço
     * @returns {Object} Instância de ServiceDTO
     */
    validate() {
        const errors = [];

        if (!this.item_id) {
            errors.push('ID do item é obrigatório');
        }

        if (this.service_group_id && typeof this.service_group_id !== 'number') {
            errors.push('ID do grupo de serviço deve ser um número');
        }

        if (this.active !== undefined && typeof this.active !== 'boolean') {
            errors.push('Status ativo deve ser um booleano');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }

        return this;
    }
}

module.exports = ServiceDTO;
