const ContractAdjustmentHistoryService = require('../service/contract-adjustment-history.service');
const ContractAdjustmentHistoryDto = require('../dto/contract-adjustment-history.dto');

class ContractAdjustmentHistoryController {
  constructor() {
    this.service = ContractAdjustmentHistoryService;
  }

  async listAll(req, res) {
    try {
      const adjustmentHistories = await this.service.listAllAdjustmentHistories();
      return res.status(200).json(adjustmentHistories);
    } catch (error) {
      console.error('Erro no controller ao listar históricos de ajuste:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async create(req, res) {
    try {
      const { error } = ContractAdjustmentHistoryDto.createValidation().validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { 
        contractId, 
        previousValue, 
        newValue, 
        changeType, 
        changedBy 
      } = req.body;

      const adjustmentHistory = await this.service.createAdjustmentHistory(
        contractId, 
        previousValue, 
        newValue, 
        changeType, 
        changedBy
      );

      return res.status(201).json(adjustmentHistory);
    } catch (error) {
      console.error('Erro no controller ao criar histórico de ajuste:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getByContractId(req, res) {
    try {
      const { contractId } = req.params;

      const adjustmentHistories = await this.service.getAdjustmentHistoryByContractId(contractId);

      return res.status(200).json(adjustmentHistories);
    } catch (error) {
      console.error('Erro no controller ao buscar históricos de ajuste:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req, res) {
    try {
      const { error } = ContractAdjustmentHistoryDto.updateValidation().validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { adjustmentHistoryId } = req.params;

      const updatedAdjustmentHistory = await this.service.updateAdjustmentHistory(
        adjustmentHistoryId, 
        req.body
      );

      return res.status(200).json(updatedAdjustmentHistory);
    } catch (error) {
      console.error('Erro no controller ao atualizar histórico de ajuste:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async delete(req, res) {
    try {
      const { adjustmentHistoryId } = req.params;

      await this.service.deleteAdjustmentHistory(adjustmentHistoryId);

      return res.status(204).send();
    } catch (error) {
      console.error('Erro no controller ao deletar histórico de ajuste:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = ContractAdjustmentHistoryController;
