const { logger } = require('../middlewares/logger');

async function up(pool) {
    try {
        await pool.query(`
            -- Criar tabela de tipos de tasks
            CREATE TABLE task_types (
                type_id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Adicionar colunas na tabela tasks
            ALTER TABLE tasks
                ADD COLUMN priority INTEGER DEFAULT 0,
                ADD COLUMN retries INTEGER DEFAULT 0,
                ADD COLUMN max_retries INTEGER DEFAULT 3,
                ADD COLUMN result JSONB,
                ADD COLUMN scheduled_for TIMESTAMP;

            -- Criar tabela de execuções
            CREATE TABLE task_executions (
                execution_id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(task_id),
                status VARCHAR(20) NOT NULL,
                started_at TIMESTAMP NOT NULL,
                completed_at TIMESTAMP,
                error_message TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Inserir tipos de tasks padrão
            INSERT INTO task_types (name, description) VALUES
                ('BOLETO', 'Processamento de boletos'),
                ('MESSAGE', 'Envio de mensagens'),
                ('NFSE', 'Processamento de notas fiscais');
        `);

        logger.info('Migration executada com sucesso: enhance_tasks');
    } catch (error) {
        logger.error('Erro ao executar migration: enhance_tasks', {
            error: error.message
        });
        throw error;
    }
}

async function down(pool) {
    try {
        await pool.query(`
            DROP TABLE IF EXISTS task_executions;
            
            ALTER TABLE tasks
                DROP COLUMN priority,
                DROP COLUMN retries,
                DROP COLUMN max_retries,
                DROP COLUMN result,
                DROP COLUMN scheduled_for;

            DROP TABLE IF EXISTS task_types;
        `);

        logger.info('Rollback executado com sucesso: enhance_tasks');
    } catch (error) {
        logger.error('Erro ao executar rollback: enhance_tasks', {
            error: error.message
        });
        throw error;
    }
}

module.exports = {
    up,
    down
};
