const ContractAdjustmentHistoryRepository = require('../../infra/repositories/contract-adjustment-history.repository');

class ContractAdjustmentHistoryController {
  async create(req, res) {
    try {
      const data = req.body;
      const result = await ContractAdjustmentHistoryRepository.create(data);
      res.status(201).json(result);
    } catch (error) {
      console.error('Erro ao criar histórico de ajuste:', error);
      res.status(500).json({ 
        message: 'Erro ao criar histórico de ajuste de contrato',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async findAll(req, res) {
    try {
      const { contractId, page, limit } = req.query;
      const filters = { contractId, page, limit };
      const result = await ContractAdjustmentHistoryRepository.findAll(filters);
      res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao buscar históricos de ajuste:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar históricos de ajuste de contrato',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async findById(req, res) {
    try {
      const { id } = req.params;
      const result = await ContractAdjustmentHistoryRepository.findById(id);
      
      if (!result) {
        return res.status(404).json({ message: 'Histórico de ajuste não encontrado' });
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao buscar histórico de ajuste:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar histórico de ajuste de contrato',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const result = await ContractAdjustmentHistoryRepository.update(id, data);
      
      if (!result) {
        return res.status(404).json({ message: 'Histórico de ajuste não encontrado' });
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao atualizar histórico de ajuste:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar histórico de ajuste de contrato',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const result = await ContractAdjustmentHistoryRepository.delete(id);
      
      if (!result) {
        return res.status(404).json({ message: 'Histórico de ajuste não encontrado' });
      }
      
      res.status(200).json({ message: 'Histórico de ajuste deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar histórico de ajuste:', error);
      res.status(500).json({ 
        message: 'Erro ao deletar histórico de ajuste de contrato',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new ContractAdjustmentHistoryController();
