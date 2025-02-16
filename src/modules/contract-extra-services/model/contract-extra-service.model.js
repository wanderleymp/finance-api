class ContractExtraService {
    constructor(data = {}) {
        this.extraServiceId = data.extraServiceId || data.extra_service_id;
        this.contractId = data.contractId || data.contract_id;
        this.serviceId = data.serviceId || data.service_id;
        this.itemDescription = data.itemDescription || data.item_description;
        this.itemValue = data.itemValue || data.item_value;
        this.serviceDate = data.serviceDate || data.service_date;
        this.movementId = data.movementId || data.movement_id;
    }

    validate() {
        if (!this.contractId) {
            throw new Error('Contract ID é obrigatório');
        }
        if (!this.serviceId) {
            throw new Error('Service ID é obrigatório');
        }
        if (!this.itemDescription) {
            throw new Error('Descrição do item é obrigatória');
        }
        if (!this.itemValue || this.itemValue <= 0) {
            throw new Error('Valor do item deve ser positivo');
        }
        if (!this.serviceDate) {
            throw new Error('Data do serviço é obrigatória');
        }
    }

    toJSON() {
        return {
            extra_service_id: this.extraServiceId,
            contract_id: this.contractId,
            service_id: this.serviceId,
            item_description: this.itemDescription,
            item_value: this.itemValue,
            service_date: this.serviceDate,
            movement_id: this.movementId
        };
    }
}

module.exports = ContractExtraService;
