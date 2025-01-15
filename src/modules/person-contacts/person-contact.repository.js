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
            let whereConditions = [];
            const queryParams = [];
            let paramCount = 1;

            // Constrói a cláusula WHERE
            if (filters.person_id) {
                whereConditions.push(`pc.person_id = $${paramCount}`);
                queryParams.push(filters.person_id);
                paramCount++;
            }

            if (filters.search) {
                whereConditions.push(`(
                    c.contact_name ILIKE $${paramCount}
                    OR c.contact_value ILIKE $${paramCount}
                    OR c.contact_type ILIKE $${paramCount}
                )`);
                queryParams.push(`%${filters.search}%`);
                paramCount++;
            }

            const whereClause = whereConditions.length > 0 
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';

            // Adiciona parâmetros de paginação
            queryParams.push(limit, offset);

            // Query para buscar os dados
            const query = `
                SELECT 
                    pc.person_contact_id,
                    pc.person_id,
                    pc.contact_id,
                    c.contact_value,
                    c.contact_type,
                    c.contact_name
                FROM ${this.tableName} pc
                JOIN contacts c ON c.contact_id = pc.contact_id
                ${whereClause}
                ORDER BY pc.contact_id DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query para contar o total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName} pc
                JOIN contacts c ON c.contact_id = pc.contact_id
                ${whereClause}
            `;

            // Executa as queries
            const [data, countResult] = await Promise.all([
                this.pool.query(query, [...queryParams]),
                this.pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            const totalItems = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(totalItems / limit);

            return {
                items: data.rows,
                meta: {
                    totalItems,
                    itemCount: data.rows.length,
                    itemsPerPage: limit,
                    totalPages,
                    currentPage: page
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
     * Busca contatos de uma pessoa
     */
    async findByPersonId(personId) {
        try {
            const query = `
                SELECT 
                    pc.person_contact_id,
                    pc.person_id,
                    pc.contact_id,
                    c.contact_value,
                    c.contact_type,
                    c.contact_name
                FROM ${this.tableName} pc
                JOIN contacts c ON c.contact_id = pc.contact_id
                WHERE pc.person_id = $1
                ORDER BY pc.contact_id
            `;

            const result = await this.pool.query(query, [personId]);

            return {
                items: result.rows || [],
                total: result.rows.length
            };
        } catch (error) {
            logger.error('Erro ao listar person-contacts', { 
                error: error.message, 
                personId 
            });

            // Se for um erro de tabela não existente, retorna estrutura vazia
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                logger.warn('Tabela de contatos não encontrada, retornando estrutura vazia', { personId });
                return {
                    items: [],
                    total: 0
                };
            }

            throw error;
        }
    }

    /**
     * Busca um vínculo específico entre pessoa e contato
     */
    async findByPersonAndContact(personId, contactId, { client } = {}) {
        try {
            const query = `
                SELECT 
                    pc.person_contact_id,
                    pc.person_id,
                    pc.contact_id,
                    pc.created_at,
                    c.contact_value,
                    c.contact_type,
                    c.contact_name
                FROM ${this.tableName} pc
                JOIN contacts c ON c.contact_id = pc.contact_id
                WHERE pc.person_id = $1 AND pc.contact_id = $2
            `;

            const pool = client || this.pool;
            const result = await pool.query(query, [personId, contactId]);

            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar vínculo pessoa-contato', {
                error: error.message,
                personId,
                contactId
            });
            throw error;
        }
    }

    /**
     * Cria uma nova associação entre pessoa e contato
     */
    async create(data, { client } = {}) {
        try {
            const query = `
                WITH inserted AS (
                    INSERT INTO ${this.tableName} (person_id, contact_id)
                    VALUES ($1, $2)
                    RETURNING person_contact_id, contact_id, created_at
                )
                SELECT 
                    i.person_contact_id,
                    i.contact_id,
                    i.created_at,
                    c.contact_value,
                    c.contact_type,
                    c.contact_name
                FROM inserted i
                JOIN contacts c ON c.contact_id = i.contact_id
            `;

            const pool = client || this.pool;
            const result = await pool.query(query, [
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
