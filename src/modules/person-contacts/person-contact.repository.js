const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const IPersonContactRepository = require('./interfaces/person-contact-repository.interface');

class PersonContactRepository extends IPersonContactRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
        this.tableName = 'person_contacts';
    }

    /**
     * Lista todos os person-contacts com paginação
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            const values = [limit, offset];
            let whereClause = '';
            
            if (filters.person_id) {
                whereClause = 'WHERE person_id = $3';
                values.push(filters.person_id);
            }

            const query = `
                SELECT pc.*, p.full_name, c.contact_value, c.contact_type, c.contact_name
                FROM ${this.tableName} pc
                JOIN persons p ON p.person_id = pc.person_id
                JOIN contacts c ON c.contact_id = pc.contact_id
                ${whereClause}
                ORDER BY pc.created_at DESC
                LIMIT $1 OFFSET $2
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName}
                ${whereClause}
            `;

            const [result, count] = await Promise.all([
                this.pool.query(query, values),
                this.pool.query(countQuery, whereClause ? [filters.person_id] : [])
            ]);

            return {
                data: result.rows,
                pagination: {
                    total: parseInt(count.rows[0].total),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(parseInt(count.rows[0].total) / limit)
                }
            };
        } catch (error) {
            logger.error('Erro ao listar person-contacts', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca um person-contact pelo ID
     */
    async findById(id) {
        try {
            const query = `
                SELECT pc.*, p.full_name, c.contact_value, c.contact_type, c.contact_name
                FROM ${this.tableName} pc
                JOIN persons p ON p.person_id = pc.person_id
                JOIN contacts c ON c.contact_id = pc.contact_id
                WHERE pc.person_contact_id = $1
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar person-contact por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Busca contatos de uma pessoa com paginação
     */
    async findByPersonId(personId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const values = [personId, limit, offset];

            const query = `
                SELECT pc.*, c.contact_value, c.contact_type, c.contact_name
                FROM ${this.tableName} pc
                JOIN contacts c ON c.contact_id = pc.contact_id
                WHERE pc.person_id = $1
                ORDER BY pc.created_at DESC
                LIMIT $2 OFFSET $3
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName}
                WHERE person_id = $1
            `;

            const [result, count] = await Promise.all([
                this.pool.query(query, values),
                this.pool.query(countQuery, [personId])
            ]);

            return {
                data: result.rows,
                pagination: {
                    total: parseInt(count.rows[0].total),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(parseInt(count.rows[0].total) / limit)
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                personId,
                page,
                limit
            });
            throw error;
        }
    }

    /**
     * Cria uma nova associação entre pessoa e contato
     */
    async create(data) {
        try {
            const query = `
                INSERT INTO ${this.tableName} (person_id, contact_id)
                VALUES ($1, $2)
                RETURNING *
            `;

            const result = await this.pool.query(query, [
                data.person_id,
                data.contact_id
            ]);

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar person-contact', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    /**
     * Remove uma associação entre pessoa e contato
     */
    async delete(id) {
        try {
            const query = `
                DELETE FROM ${this.tableName}
                WHERE person_contact_id = $1
                RETURNING *
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao deletar person-contact', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = PersonContactRepository;
