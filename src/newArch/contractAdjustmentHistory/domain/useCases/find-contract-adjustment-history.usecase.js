const contractAdjustmentHistoryRepository = require('../../infra/repositories/contract-adjustment-history.repository');

class FindContractAdjustmentHistoryUseCase {
  constructor(repository = contractAdjustmentHistoryRepository) {
    this.repository = repository;
  }

  async findByContractId(contractId, page = 1, limit = 10) {
    if (!contractId) {
      throw new Error('ID do contrato é obrigatório');
    }

    try {
      const adjustmentHistories = await this.repository.findByContractId(contractId, page, limit);
      return adjustmentHistories;
    } catch (error) {
      console.error('Erro ao buscar histórico de ajuste por contrato:', error);
      throw error;
    }
  }

  async findById(id) {
    if (!id) {
      throw new Error('ID do histórico de ajuste é obrigatório');
    }

    try {
      const adjustmentHistory = await this.repository.findById(id);
      return adjustmentHistory;
    } catch (error) {
      console.error('Erro ao buscar histórico de ajuste por ID:', error);
      throw error;
    }
  }
}

module.exports = FindContractAdjustmentHistoryUseCase;
