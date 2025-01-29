class ContractAdjustmentContract {
    constructor(data = {}) {
        this.adjustmentId = data.adjustmentId || data.adjustment_id;
        this.contractId = data.contractId || data.contract_id;
        this.status = data.status || 'pending';
        this.appliedAt = data.appliedAt || data.applied_at || new Date();
    }

    // Método para validar dados
    validate() {
        if (!this.adjustmentId || !this.contractId) {
            throw new Error('adjustmentId e contractId são obrigatórios');
        }

        if (!['pending', 'applied', 'cancelled'].includes(this.status)) {
            throw new Error('Status inválido');
        }
    }

    // Método para converter para objeto plano
    toJSON() {
        return {
            adjustment_id: this.adjustmentId,
            contract_id: this.contractId,
            status: this.status,
            applied_at: this.appliedAt
        };
    }
}

module.exports = ContractAdjustmentContract;
