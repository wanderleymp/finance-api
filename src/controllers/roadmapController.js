const { devDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');

// Inicia uma tarefa
async function startTask(title) {
  try {
    // Verificar se a tabela existe antes de executar a query
    await devDatabase.query(`SELECT 1 FROM roadmap LIMIT 1`);

    const result = await devDatabase.query(
      `UPDATE roadmap 
       SET status = 'em progresso', started_at = NOW(), updated_at = NOW() 
       WHERE title = $1 
       RETURNING *`,
      [title]
    );
    
    if (result.rowCount > 0) {
      logger.info(`✅ Tarefa Iniciada: ${title}`, { 
        task: result.rows[0],
        action: 'start_task' 
      });
      return result.rows[0];
    } else {
      logger.warn(`⚠️ Tarefa não encontrada: ${title}`, { 
        action: 'start_task_not_found' 
      });
      return null;
    }
  } catch (error) {
    // Logar o erro específico
    logger.error(`❌ Erro ao iniciar tarefa: ${title}`, { 
      error: error.message,
      action: 'start_task_error' 
    });

    // Se for um erro de tabela não existente, tentar criar a tabela
    if (error.code === '42P01') {
      try {
        await devDatabase.query(`
          CREATE TABLE IF NOT EXISTS roadmap (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pendente',
            started_at TIMESTAMPTZ,
            finished_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_roadmap_status ON roadmap(status);
        `);
        logger.info('Tabela roadmap criada automaticamente', { action: 'create_roadmap_table' });
      } catch (createError) {
        logger.error('Erro ao criar tabela roadmap', { 
          error: createError.message,
          action: 'create_roadmap_table_error' 
        });
      }
    }

    throw error;
  }
}

// Finaliza uma tarefa
async function finishTask(title) {
  try {
    const result = await devDatabase.query(
      `UPDATE roadmap 
       SET status = 'concluído', finished_at = NOW(), updated_at = NOW() 
       WHERE title = $1 
       RETURNING *`,
      [title]
    );
    
    if (result.rowCount > 0) {
      logger.info(`✅ Tarefa Concluída: ${title}`, { 
        task: result.rows[0],
        action: 'finish_task' 
      });
      return result.rows[0];
    } else {
      logger.warn(`⚠️ Tarefa não encontrada: ${title}`, { 
        action: 'finish_task_not_found' 
      });
      return null;
    }
  } catch (error) {
    logger.error(`❌ Erro ao finalizar tarefa: ${title}`, { 
      error: error.message,
      action: 'finish_task_error' 
    });
    throw error;
  }
}

// Busca uma tarefa pelo título
async function getTaskByTitle(title) {
  try {
    const result = await devDatabase.query(
      `SELECT * FROM roadmap WHERE title = $1`,
      [title]
    );
    
    if (result.rowCount > 0) {
      return result.rows[0];
    } else {
      logger.warn(`⚠️ Tarefa não encontrada: ${title}`, { 
        action: 'get_task_not_found' 
      });
      return null;
    }
  } catch (error) {
    logger.error(`❌ Erro ao buscar tarefa: ${title}`, { 
      error: error.message,
      action: 'get_task_error' 
    });
    throw error;
  }
}

// Buscar tarefas do roadmap com filtro opcional
async function getRoadmapTasks(status) {
  try {
    let query = 'SELECT * FROM roadmap';
    const params = [];

    // Adicionar filtro de status se fornecido
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    // Ordenar por data de criação, mais recentes primeiro
    query += ' ORDER BY created_at DESC';

    const result = await devDatabase.query(query, params);
    
    return result.rows;
  } catch (error) {
    logger.error('Erro ao buscar tarefas do roadmap', { 
      error: error.message,
      status: status,
      action: 'get_roadmap_tasks_error' 
    });
    throw error;
  }
}

module.exports = { 
  startTask, 
  finishTask,
  getTaskByTitle,
  getRoadmapTasks 
};
