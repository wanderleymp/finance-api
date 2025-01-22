const BaseRepository = require('../../../repositories/base/BaseRepository');
const { logger } = require('../../../middlewares/logger');

class ContractAdjustmentHistoryRepository extends BaseRepository {
  constructor() {
    super('contract_adjustment_history', 'adjustment_history_id');
  }

  async listAll(client = null) {
    try {
      logger.info('Buscando todos os históricos de ajuste de contrato');

      const query = `
        SELECT * FROM public.contract_adjustment_history 
        ORDER BY change_date DESC
      `;

      logger.info('Query de busca de históricos de ajuste', { query });

      const pool = client || this.pool;
      const result = await pool.query(query);

      return result.rows;
    } catch (error) {
      logger.error('Erro ao buscar todos os históricos de ajuste', { error });
      throw error;
    }
  }

  async findByContractId(contractId, client = null) {
    try {
      logger.info('Buscando históricos de ajuste por contrato', { contractId });

      const query = `
        SELECT * FROM public.contract_adjustment_history 
        WHERE contract_id = $1 
        ORDER BY change_date DESC
      `;

      logger.info('Query de busca de históricos de ajuste por contrato', { query, contractId });

      const pool = client || this.pool;
      const result = await pool.query(query, [contractId]);

      return result.rows;
    } catch (error) {
      logger.error('Erro ao buscar históricos de ajuste por contrato', { error, contractId });
      throw error;
    }
  }

  async create(data, client = null) {
    try {
      logger.info('Criando histórico de ajuste de contrato', { data });

      const query = `
        INSERT INTO public.contract_adjustment_history (
          contract_id, 
          previous_value, 
          new_value, 
          change_type, 
          changed_by
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING *
      `;

      const values = [
        data.contractId,
        data.previousValue,
        data.newValue,
        data.changeType,
        data.changedBy
      ];

      logger.info('Query de criação de histórico de ajuste', { query, values });

      const pool = client || this.pool;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao criar histórico de ajuste de contrato', { error, data });
      throw error;
    }
  }

  async update(id, data, client = null) {
    try {
      logger.info('Atualizando histórico de ajuste de contrato', { id, data });

      const updateFields = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const query = `
        UPDATE public.contract_adjustment_history 
        SET ${updateFields} 
        WHERE adjustment_history_id = $1 
        RETURNING *
      `;

      const values = [
        id,
        ...Object.values(data)
      ];

      logger.info('Query de atualização de histórico de ajuste', { query, values });

      const pool = client || this.pool;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao atualizar histórico de ajuste de contrato', { error, id, data });
      throw error;
    }
  }

  async delete(id, client = null) {
    try {
      logger.info('Deletando histórico de ajuste de contrato', { id });

      const query = `
        DELETE FROM public.contract_adjustment_history 
        WHERE adjustment_history_id = $1
      `;

      logger.info('Query de deleção de histórico de ajuste', { query, id });

      const pool = client || this.pool;
      await pool.query(query, [id]);

      return true;
    } catch (error) {
      logger.error('Erro ao deletar histórico de ajuste de contrato', { error, id });
      throw error;
    }
  }
}

module.exports = new ContractAdjustmentHistoryRepository();
