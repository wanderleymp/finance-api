const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const IContactRepository = require('./interfaces/contact-repository.interface');
const ContactResponseDTO = require('./dto/contact-response.dto');

class ContactRepository extends IContactRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
        this.tableName = 'person_contacts';
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    contact_id as id,
                    person_id,
                    type,
                    contact,
                    description,
                    is_main,
                    is_active,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.person_id) {
                query += ` AND person_id = $${paramCount}`;
                params.push(filters.person_id);
                paramCount++;
            }

            if (filters.type) {
                query += ` AND type = $${paramCount}`;
                params.push(filters.type);
                paramCount++;
            }

            if (filters.is_active !== undefined) {
                query += ` AND is_active = $${paramCount}`;
                params.push(filters.is_active);
                paramCount++;
            }

            const countQuery = query.replace('*', 'COUNT(*) as total');
            query += ` ORDER BY is_main DESC, created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, params),
                this.pool.query(countQuery, params.slice(0, -2))
            ]);

            return {
                data: dataResult.rows.map(ContactResponseDTO.fromDatabase),
                total: parseInt(countResult.rows[0].total),
                page,
                limit
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
            const query = `
                SELECT 
                    contact_id as id,
                    person_id,
                    type,
                    contact,
                    description,
                    is_main,
                    is_active,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE contact_id = $1
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0] ? ContactResponseDTO.fromDatabase(result.rows[0]) : null;
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
                SELECT 
                    contact_id as id,
                    person_id,
                    type,
                    contact,
                    description,
                    is_main,
                    is_active,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE person_id = $1
                ORDER BY is_main DESC, created_at DESC
            `;
            const result = await this.pool.query(query, [personId]);
            return result.rows.map(ContactResponseDTO.fromDatabase);
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async findMainContactByPersonId(personId) {
        try {
            const query = `
                SELECT 
                    contact_id as id,
                    person_id,
                    type,
                    contact,
                    description,
                    is_main,
                    is_active,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE person_id = $1 AND is_main = true
                LIMIT 1
            `;
            const result = await this.pool.query(query, [personId]);
            return result.rows[0] ? ContactResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao buscar contato principal da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const query = `
                INSERT INTO ${this.tableName} (
                    person_id, 
                    type, 
                    contact, 
                    description, 
                    is_main,
                    is_active
                ) VALUES (
                    $1, $2, $3, $4, $5, $6
                ) RETURNING *
            `;
            const values = [
                data.person_id,
                data.type,
                data.contact,
                data.description,
                data.is_main,
                data.is_active
            ];

            const result = await this.pool.query(query, values);
            return ContactResponseDTO.fromDatabase(result.rows[0]);
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
            const updateFields = Object.keys(data)
                .filter(key => data[key] !== undefined)
                .map((key, index) => `${key} = $${index + 2}`);

            if (updateFields.length === 0) {
                throw new Error('Nenhum campo para atualizar');
            }

            const query = `
                UPDATE ${this.tableName}
                SET ${updateFields.join(', ')}, updated_at = NOW()
                WHERE contact_id = $1
                RETURNING *
            `;

            const values = [
                id,
                ...Object.keys(data)
                    .filter(key => data[key] !== undefined)
                    .map(key => data[key])
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0] ? ContactResponseDTO.fromDatabase(result.rows[0]) : null;
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
            const query = `
                DELETE FROM ${this.tableName}
                WHERE contact_id = $1
                RETURNING *
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0] ? ContactResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao deletar contato', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = ContactRepository;
