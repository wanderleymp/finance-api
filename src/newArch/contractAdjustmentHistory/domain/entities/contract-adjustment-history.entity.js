class ContractAdjustmentHistoryEntity {
  constructor(data) {
    this.id = data.id || null;
    this.contractId = data.contractId;
    this.userId = data.userId;
    this.adjustmentType = data.adjustmentType;
    this.previousValue = data.previousValue || null;
    this.newValue = data.newValue || null;
    this.description = data.description || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Método para validar a entidade
  validate() {
    if (!this.contractId) {
      throw new Error('ID do contrato é obrigatório');
    }

    if (!this.userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    if (!this.adjustmentType) {
      throw new Error('Tipo de ajuste é obrigatório');
    }

    return true;
  }

  // Método para converter para objeto plano
  toJSON() {
    return {
      id: this.id,
      contractId: this.contractId,
      userId: this.userId,
      adjustmentType: this.adjustmentType,
      previousValue: this.previousValue,
      newValue: this.newValue,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = ContractAdjustmentHistoryEntity;
