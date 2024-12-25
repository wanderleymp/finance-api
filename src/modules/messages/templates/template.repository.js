const { logger } = require('../../../middlewares/logger');
const BaseRepository = require('../../../repositories/base/BaseRepository');

class TemplateRepository extends BaseRepository {
    constructor() {
        super('message_templates', 'template_id');
    }

    /**
     * Busca um template pelo tipo
     * @param {number} typeId - ID do tipo de template
     * @returns {Promise<Template|null>}
     */
    async findByType(typeId) {
        try {
            const query = `
                SELECT *
                FROM message_templates
                WHERE chat_type_id = $1
            `;
            const result = await this.pool.query(query, [typeId]);
            
            logger.info('Template encontrado', { 
                typeId,
                found: result.rows.length > 0
            });

            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar template por tipo', {
                error: error.message,
                typeId
            });
            throw error;
        }
    }
}

module.exports = TemplateRepository;
