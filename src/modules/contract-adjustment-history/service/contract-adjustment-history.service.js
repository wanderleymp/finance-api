const ContractAdjustmentHistoryRepository = require('../repository/contract-adjustment-history.repository');
const { logger } = require('../../../middlewares/logger');

class ContractAdjustmentHistoryService {
  constructor() {
    this.repository = ContractAdjustmentHistoryRepository;
  }

  async listAllAdjustmentHistories() {
    try {
      logger.info('Listando todos os históricos de ajuste de contrato');
      return await this.repository.listAll();
    } catch (error) {
      logger.error('Erro ao listar todos os históricos de ajuste de contrato', { error });
      throw error;
    }
  }

  async createAdjustmentHistory(contractId, previousValue, newValue, changeType, changedBy) {
    try {
      logger.info('Criando histórico de ajuste de contrato', { 
        contractId, 
        previousValue, 
        newValue, 
        changeType, 
        changedBy 
      });

      const adjustmentHistoryData = {
        contractId,
        previousValue,
        newValue,
        changeType,
        changedBy
      };

      return await this.repository.create(adjustmentHistoryData);
    } catch (error) {
      logger.error('Erro ao criar histórico de ajuste de contrato', { error, adjustmentHistoryData });
      throw error;
    }
  }

  async getAdjustmentHistoryByContractId(contractId) {
    try {
      logger.info('Buscando históricos de ajuste por contrato', { contractId });
      return await this.repository.findByContractId(contractId);
    } catch (error) {
      logger.error('Erro ao buscar históricos de ajuste por contrato', { error, contractId });
      throw error;
    }
  }

  async updateAdjustmentHistory(adjustmentHistoryId, updateData) {
    try {
      logger.info('Atualizando histórico de ajuste de contrato', { 
        adjustmentHistoryId, 
        updateData 
      });
      return await this.repository.update(adjustmentHistoryId, updateData);
    } catch (error) {
      logger.error('Erro ao atualizar histórico de ajuste de contrato', { 
        error, 
        adjustmentHistoryId, 
        updateData 
      });
      throw error;
    }
  }

  async deleteAdjustmentHistory(adjustmentHistoryId) {
    try {
      logger.info('Deletando histórico de ajuste de contrato', { adjustmentHistoryId });
      return await this.repository.delete(adjustmentHistoryId);
    } catch (error) {
      logger.error('Erro ao deletar histórico de ajuste de contrato', { 
        error, 
        adjustmentHistoryId 
      });
      throw error;
    }
  }
}

module.exports = new ContractAdjustmentHistoryService();
