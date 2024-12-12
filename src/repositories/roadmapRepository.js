const { Pool } = require('pg');
require('dotenv').config();

class RoadmapRepository {
  constructor() {
    // Remover parâmetro SSL da URL
    const cleanUrl = process.env.DEV_DATABASE_URL.replace(/\?.*$/, '');
    
    // Configurar conexão usando variáveis de ambiente
    this.pool = new Pool({
      connectionString: cleanUrl,
      ssl: false
    });

    // Adicionar log de erros no pool
    this.pool.on('error', (err) => {
      console.error('Erro no pool de conexão do roadmap:', err);
    });
  }

  // Método para executar queries
  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Erro na execução da query', { 
        error: error.message,
        query: text,
        params
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Buscar todas as tarefas
  async findAll(status = null) {
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

      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar tarefas do roadmap', { 
        error: error.message,
        status: status
      });
      throw error;
    }
  }

  // Criar nova tarefa
  async create(title, description, status = 'pendente') {
    try {
      const query = `
        INSERT INTO roadmap (title, description, status, started_at) 
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
        RETURNING *
      `;
      const params = [title, description, status];

      const result = await this.query(query, params);
      
      console.info('Tarefa criada no roadmap', { 
        task: result.rows[0]
      });

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar tarefa no roadmap', { 
        error: error.message,
        title
      });
      throw error;
    }
  }

  // Atualizar status de uma tarefa
  async updateStatus(id, status) {
    try {
      const query = `
        UPDATE roadmap 
        SET status = $1, 
            updated_at = CURRENT_TIMESTAMP,
            finished_at = CASE WHEN $1 = 'concluído' THEN CURRENT_TIMESTAMP ELSE finished_at END
        WHERE id = $2 
        RETURNING *
      `;
      const params = [status, id];

      const result = await this.query(query, params);
      
      if (result.rowCount === 0) {
        console.warn('Tarefa não encontrada para atualização', { 
          id,
          status
        });
        return null;
      }

      console.info('Status da tarefa atualizado', { 
        task: result.rows[0]
      });

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa', { 
        error: error.message,
        id,
        status
      });
      throw error;
    }
  }

  // Atualizar descrição de uma tarefa
  async updateDescription(id, description) {
    try {
      const query = `
        UPDATE roadmap 
        SET description = $1, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 
        RETURNING *
      `;
      const params = [description, id];

      const result = await this.query(query, params);
      
      if (result.rowCount === 0) {
        console.warn('Tarefa não encontrada para atualização de descrição', { 
          id,
          description
        });
        return null;
      }

      console.info('Descrição da tarefa atualizada', { 
        task: result.rows[0]
      });

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar descrição da tarefa', { 
        error: error.message,
        id,
        description
      });
      throw error;
    }
  }

  // Buscar tarefa por ID
  async findById(id) {
    try {
      const query = 'SELECT * FROM roadmap WHERE id = $1';
      const result = await this.query(query, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar tarefa por ID', { 
        error: error.message,
        id
      });
      throw error;
    }
  }

  // Atualizar tarefa
  async update(id, updateData) {
    try {
      // Construir a query dinamicamente baseada nos campos recebidos
      const fields = Object.keys(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const values = fields.map(field => updateData[field]);

      const query = `
        UPDATE roadmap 
        SET ${setClause}, 
            updated_at = CURRENT_TIMESTAMP,
            finished_at = CASE WHEN $${fields.length + 1} = 'concluído' THEN CURRENT_TIMESTAMP ELSE finished_at END
        WHERE id = $${fields.length + 2} 
        RETURNING *
      `;
      
      const params = [...values, updateData.status || null, id];

      const result = await this.query(query, params);
      
      if (result.rowCount === 0) {
        console.warn('Tarefa não encontrada para atualização', { 
          id,
          updateData
        });
        return null;
      }

      console.info('Tarefa atualizada', { 
        task: result.rows[0]
      });

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar tarefa', { 
        error: error.message,
        id,
        updateData
      });
      throw error;
    }
  }
}

module.exports = new RoadmapRepository();
