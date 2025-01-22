const contractAdjustmentHistoryRepository = require('../../infra/repositories/contract-adjustment-history.repository');

class DeleteContractAdjustmentHistoryUseCase {
  constructor(repository = contractAdjustmentHistoryRepository) {
    this.repository = repository;
  }

  async execute(id) {
    // Validações básicas
    if (!id) {
      throw new Error('ID do histórico de ajuste é obrigatório');
    }

    // Verificar se o registro existe
    const existingHistory = await this.repository.findById(id);
    if (!existingHistory) {
      throw new Error('Histórico de ajuste não encontrado');
    }

    // Deletar o registro
    try {
      await this.repository.delete(id);
    } catch (error) {
      console.error('Erro ao deletar histórico de ajuste:', error);
      throw error;
    }
  }
}

module.exports = DeleteContractAdjustmentHistoryUseCase;
