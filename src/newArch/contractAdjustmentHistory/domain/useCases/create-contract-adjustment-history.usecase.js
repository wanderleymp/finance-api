const contractAdjustmentHistoryRepository = require('../../infra/repositories/contract-adjustment-history.repository');

class CreateContractAdjustmentHistoryUseCase {
  constructor(repository = contractAdjustmentHistoryRepository) {
    this.repository = repository;
  }

  async execute(contractAdjustmentHistoryData) {
    // Validações básicas
    if (!contractAdjustmentHistoryData.contractId) {
      throw new Error('ID do contrato é obrigatório');
    }

    if (!contractAdjustmentHistoryData.userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    if (!contractAdjustmentHistoryData.adjustmentType) {
      throw new Error('Tipo de ajuste é obrigatório');
    }

    // Criar registro de histórico de ajuste
    try {
      const createdHistory = await this.repository.create(contractAdjustmentHistoryData);
      return createdHistory;
    } catch (error) {
      console.error('Erro ao criar histórico de ajuste de contrato:', error);
      throw error;
    }
  }
}

module.exports = CreateContractAdjustmentHistoryUseCase;
