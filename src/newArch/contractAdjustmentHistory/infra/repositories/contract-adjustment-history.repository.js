const { pool } = require('../../../../database');

class ContractAdjustmentHistoryRepository {
  async create(data) {
    const { 
      contractId, 
      adjustmentType, 
      adjustmentValue, 
      adjustmentDate, 
      description 
    } = data;

    const query = `
      INSERT INTO contract_adjustment_history 
      (contract_id, adjustment_type, adjustment_value, adjustment_date, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        contractId, 
        adjustmentType, 
        adjustmentValue, 
        adjustmentDate, 
        description
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar histórico de ajuste de contrato:', error);
      throw error;
    }
  }

  async findAll(filters = {}) {
    const { contractId, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM contract_adjustment_history WHERE 1=1';
    const params = [];

    if (contractId) {
      query += ' AND contract_id = $1';
      params.push(contractId);
    }

    query += ' ORDER BY adjustment_date DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar históricos de ajuste de contrato:', error);
      throw error;
    }
  }

  async findById(id) {
    const query = 'SELECT * FROM contract_adjustment_history WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar histórico de ajuste de contrato por ID:', error);
      throw error;
    }
  }

  async update(id, data) {
    const { 
      adjustmentType, 
      adjustmentValue, 
      adjustmentDate, 
      description 
    } = data;

    const query = `
      UPDATE contract_adjustment_history 
      SET 
        adjustment_type = $1, 
        adjustment_value = $2, 
        adjustment_date = $3, 
        description = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        adjustmentType, 
        adjustmentValue, 
        adjustmentDate, 
        description,
        id
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar histórico de ajuste de contrato:', error);
      throw error;
    }
  }

  async delete(id) {
    const query = 'DELETE FROM contract_adjustment_history WHERE id = $1 RETURNING *';

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao deletar histórico de ajuste de contrato:', error);
      throw error;
    }
  }
}

module.exports = new ContractAdjustmentHistoryRepository();
