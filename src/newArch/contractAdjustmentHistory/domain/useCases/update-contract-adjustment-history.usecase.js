const contractAdjustmentHistoryRepository = require('../../infra/repositories/contract-adjustment-history.repository');

class UpdateContractAdjustmentHistoryUseCase {
  constructor(repository = contractAdjustmentHistoryRepository) {
    this.repository = repository;
  }

  async execute(id, contractAdjustmentHistoryData) {
    // Validações básicas
    if (!id) {
      throw new Error('ID do histórico de ajuste é obrigatório');
    }

    if (!contractAdjustmentHistoryData.contractId) {
      throw new Error('ID do contrato é obrigatório');
    }

    if (!contractAdjustmentHistoryData.userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    if (!contractAdjustmentHistoryData.adjustmentType) {
      throw new Error('Tipo de ajuste é obrigatório');
    }

    // Atualizar registro de histórico de ajuste
    try {
      const updatedHistory = await this.repository.update(id, contractAdjustmentHistoryData);
      return updatedHistory;
    } catch (error) {
      console.error('Erro ao atualizar histórico de ajuste de contrato:', error);
      throw error;
    }
  }
}

module.exports = UpdateContractAdjustmentHistoryUseCase;
