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
            let whereClause = '';
            const queryParams = [];
            let paramCount = 1;

            // Constrói a cláusula WHERE
            if (filters.person_id) {
                whereClause = `WHERE pc.person_id = $${paramCount}`;
                queryParams.push(filters.person_id);
                paramCount++;
            }

            // Adiciona parâmetros de paginação
            queryParams.push(limit, offset);

            const query = `
                SELECT 
                    pc.contact_id,
                    pc.created_at,
                    c.contact_value,
                    c.contact_type,
                    c.contact_name
                FROM ${this.tableName} pc
                JOIN contacts c ON c.contact_id = pc.contact_id
                ${whereClause}
                ORDER BY pc.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName} pc
                ${whereClause}
            `;

            // Para a query de contagem, usamos apenas os parâmetros do WHERE
            const countParams = filters.person_id ? [filters.person_id] : [];

            const [result, count] = await Promise.all([
                this.pool.query(query, queryParams),
                this.pool.query(countQuery, countParams)
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
            logger.error('Erro ao listar person-contacts', { error: error.message, page, limit, filters });
            throw error;
        }
    }

    /**
     * Busca um person-contact pelo ID
     */
    async findById(id) {
        try {
            const query = `
                SELECT 
                    pc.contact_id,
                    pc.created_at,
                    c.contact_value,
                    c.contact_type,
                    c.contact_name
                FROM ${this.tableName} pc
                JOIN contacts c ON c.contact_id = pc.contact_id
                WHERE pc.person_contact_id = $1
            `;

            const result = await this.pool.query(query, [id]);

            if (result.rows.length === 0) {
                throw new Error('Person-contact não encontrado');
            }

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
                SELECT 
                    pc.contact_id,
                    pc.created_at,
                    c.contact_value,
                    c.contact_type,
                    c.contact_name
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
                WITH inserted AS (
                    INSERT INTO ${this.tableName} (person_id, contact_id)
                    VALUES ($1, $2)
                    RETURNING contact_id, created_at
                )
                SELECT 
                    i.contact_id,
                    i.created_at,
                    c.contact_value,
                    c.contact_type,
                    c.contact_name
                FROM inserted i
                JOIN contacts c ON c.contact_id = i.contact_id
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
                WITH deleted AS (
                    DELETE FROM ${this.tableName}
                    WHERE person_contact_id = $1
                    RETURNING contact_id, created_at
                )
                SELECT 
                    d.contact_id,
                    d.created_at,
                    c.contact_value,
                    c.contact_type,
                    c.contact_name
                FROM deleted d
                JOIN contacts c ON c.contact_id = d.contact_id
            `;

            const result = await this.pool.query(query, [id]);

            if (result.rows.length === 0) {
                throw new Error('Person-contact não encontrado');
            }

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
