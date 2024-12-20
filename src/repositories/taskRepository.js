const BaseRepository = require('./base/BaseRepository');
const { logger } = require('../middlewares/logger');

class TaskRepository extends BaseRepository {
    constructor() {
        super('tasks');
    }

    /**
     * Lista tarefas com informações relacionadas
     * @param {Object} filters - Filtros para busca
     * @param {Object} [client] - Client opcional para transação
     */
    async findAllDetailed(filters = {}, client) {
        try {
            const { whereClause, queryParams } = this.buildWhereClause(filters);

            const query = `
                SELECT 
                    t.*,
                    m.description as movement_description,
                    b.barcode as boleto_barcode
                FROM tasks t
                LEFT JOIN movements m ON t.movement_id = m.id
                LEFT JOIN boletos b ON t.boleto_id = b.id
                ${whereClause}
                ORDER BY t.created_at DESC
            `;

            const result = await this.query(query, queryParams, client);
            return result.rows;
        } catch (error) {
            logger.error('Repository: Erro ao listar tarefas com detalhes', {
                error: error.message,
                filters
            });
            throw error;
        }
    }
}

module.exports = TaskRepository;
