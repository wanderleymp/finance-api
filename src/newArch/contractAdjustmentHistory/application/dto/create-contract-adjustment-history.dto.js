class CreateContractAdjustmentHistoryDto {
    constructor(data) {
        this.contractId = data.contractId;
        this.userId = data.userId;
        this.adjustmentType = data.adjustmentType;
        this.previousValue = data.previousValue;
        this.newValue = data.newValue;
        this.description = data.description;
    }

    validate() {
        const errors = [];

        if (!this.contractId) {
            errors.push('ID do contrato é obrigatório');
        }

        if (!this.userId) {
            errors.push('ID do usuário é obrigatório');
        }

        if (!this.adjustmentType) {
            errors.push('Tipo de ajuste é obrigatório');
        }

        if (this.previousValue === undefined || this.previousValue === null) {
            errors.push('Valor anterior é obrigatório');
        }

        if (this.newValue === undefined || this.newValue === null) {
            errors.push('Novo valor é obrigatório');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }

        return true;
    }

    toJSON() {
        return {
            contractId: this.contractId,
            userId: this.userId,
            adjustmentType: this.adjustmentType,
            previousValue: this.previousValue,
            newValue: this.newValue,
            description: this.description
        };
    }
}

module.exports = CreateContractAdjustmentHistoryDto;
