const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const ContactResponseDTO = require('./dto/contact-response.dto');

class ContactRepository extends BaseRepository {
    constructor() {
        super('contacts', 'contact_id');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Constrói as condições WHERE
            const conditions = [];
            const params = [];
            let paramCount = 1;

            if (filters.search) {
                conditions.push(`(
                    contact_name ILIKE $${paramCount}
                    OR contact_value ILIKE $${paramCount}
                )`);
                params.push(`%${filters.search}%`);
                paramCount++;
            }

            if (filters.type) {
                conditions.push(`contact_type = $${paramCount}`);
                params.push(filters.type);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? 'WHERE ' + conditions.join(' AND ')
                : '';

            // Query principal
            const query = `
                SELECT *
                FROM contacts
                ${whereClause}
                ORDER BY contact_id DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM contacts
                ${whereClause}
            `;

            // Adiciona os parâmetros de paginação
            const offset = (page - 1) * limit;
            params.push(limit, offset);

            // Executa as queries
            const [result, countResult] = await Promise.all([
                this.pool.query(query, params),
                this.pool.query(countQuery, params.slice(0, -2)) // Remove os parâmetros de paginação
            ]);

            const total = parseInt(countResult.rows[0].total);

            return {
                items: result.rows.map(ContactResponseDTO.fromDatabase),
                meta: {
                    totalItems: total,
                    itemCount: result.rows.length,
                    itemsPerPage: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    currentPage: parseInt(page)
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar contatos', {
                error: error.message,
                filters,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            const result = await super.findById(id);
            return result ? ContactResponseDTO.fromDatabase(result) : null;
        } catch (error) {
            logger.error('Erro ao buscar contato por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByPersonId(personId) {
        try {
            const query = `
                SELECT c.*
                FROM contacts c
                INNER JOIN person_contacts pc ON c.contact_id = pc.contact_id
                WHERE pc.person_id = $1
                ORDER BY c.created_at DESC
            `;
            
            const result = await this.pool.query(query, [personId]);
            return result.rows.map(ContactResponseDTO.fromDatabase);
        } catch (error) {
            logger.error('Erro ao buscar contatos por pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const result = await super.create(data);
            return ContactResponseDTO.fromDatabase(result);
        } catch (error) {
            logger.error('Erro ao criar contato', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const result = await super.update(id, data);
            return result ? ContactResponseDTO.fromDatabase(result) : null;
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            return await super.delete(id);
        } catch (error) {
            logger.error('Erro ao deletar contato', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByValueAndType(value, type, { client = null } = {}) {
        try {
            const queryClient = client || this.pool;
            const query = `
                SELECT *
                FROM ${this.tableName}
                WHERE contact_value = $1
                AND contact_type = $2
                LIMIT 1
            `;
            const result = await queryClient.query(query, [value, type]);
            return result.rows[0] ? ContactResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao buscar contato por valor e tipo', {
                error: error.message,
                value,
                type
            });
            throw error;
        }
    }
}

module.exports = ContactRepository;
