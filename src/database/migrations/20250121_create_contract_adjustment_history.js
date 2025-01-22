const pool = require('../index');

async function createContractAdjustmentHistoryTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS contract_adjustment_history (
      id SERIAL PRIMARY KEY,
      contract_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      adjustment_type VARCHAR(50) NOT NULL,
      previous_value NUMERIC(15, 2),
      new_value NUMERIC(15, 2),
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(createTableQuery);
    console.log('Tabela contract_adjustment_history criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar tabela contract_adjustment_history:', error);
    throw error;
  }
}

module.exports = { createContractAdjustmentHistoryTable };
