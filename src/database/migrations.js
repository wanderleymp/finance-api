const pool = require('./index');
const { createContractAdjustmentHistoryTable } = require('./migrations/20250121_create_contract_adjustment_history');

async function checkAndRunMigrations() {
  try {
    console.log('Verificando e aplicando migrações...');
    
    // Criar tabela de migrações se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lista de migrações a serem executadas
    const migrationFunctions = [
      { name: 'createContractAdjustmentHistoryTable', func: createContractAdjustmentHistoryTable }
    ];

    // Executar migrações
    for (const migration of migrationFunctions) {
      try {
        // Verificar se a migração já foi executada
        const existingMigration = await pool.query(
          'SELECT * FROM migrations WHERE name = $1', 
          [migration.name]
        );

        if (existingMigration.rows.length === 0) {
          // Executar migração
          await migration.func();

          // Registrar migração como executada
          await pool.query(
            'INSERT INTO migrations (name) VALUES ($1)', 
            [migration.name]
          );

          console.log(`Migração ${migration.name} executada com sucesso`);
        } else {
          console.log(`Migração ${migration.name} já foi executada anteriormente`);
        }
      } catch (migrationError) {
        console.error(`Erro na migração ${migration.name}:`, migrationError);
        throw migrationError;
      }
    }

    console.log('Todas as migrações foram verificadas e aplicadas com sucesso');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    throw error;
  }
}

module.exports = { checkAndRunMigrations };
