const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonAddressRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT 
                    pa.address_id as id,
                    pa.person_id,
                    pa.street,
                    pa.number,
                    pa.complement,
                    pa.neighborhood,
                    pa.city,
                    pa.state,
                    pa.postal_code,
                    pa.country,
                    pa.reference,
                    pa.ibge,
                    p.full_name as person_name
                FROM person_addresses pa
                JOIN persons p ON p.person_id = pa.person_id
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            if (filters.person_id) {
                query += ` AND pa.person_id = $${paramCount}`;
                values.push(filters.person_id);
                paramCount++;
            }

            if (filters.city) {
                query += ` AND pa.city ILIKE $${paramCount}`;
                values.push(`%${filters.city}%`);
                paramCount++;
            }

            if (filters.state) {
                query += ` AND pa.state = $${paramCount}`;
                values.push(filters.state);
                paramCount++;
            }

            // Contar total de registros
            const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
            const countResult = await this.pool.query(countQuery, values);
            const total = parseInt(countResult.rows[0].total);

            // Adicionar paginação
            query += ` ORDER BY pa.address_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            values.push(validLimit, offset);

            const result = await this.pool.query(query, values);

            return {
                data: result.rows,
                total
            };
        } catch (error) {
            logger.error('Erro ao buscar endereços de pessoas', {
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
                    pa.address_id as id,
                    pa.person_id,
                    pa.street,
                    pa.number,
                    pa.complement,
                    pa.neighborhood,
                    pa.city,
                    pa.state,
                    pa.postal_code,
                    pa.country,
                    pa.reference,
                    pa.ibge,
                    p.full_name as person_name
                FROM person_addresses pa
                JOIN persons p ON p.person_id = pa.person_id
                WHERE pa.address_id = $1
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar endereço de pessoa por ID', {
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
                    address_id as id,
                    person_id,
                    street,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state,
                    postal_code,
                    country,
                    reference,
                    ibge
                FROM person_addresses
                WHERE person_id = $1
                ORDER BY address_id
            `;
            const result = await this.pool.query(query, [personId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar endereços da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const query = `
                INSERT INTO person_addresses (
                    person_id,
                    street,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state,
                    postal_code,
                    country,
                    reference,
                    ibge
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;
            const values = [
                data.person_id,
                data.street,
                data.number,
                data.complement,
                data.neighborhood,
                data.city,
                data.state,
                data.postal_code,
                data.country || 'Brasil',
                data.reference,
                data.ibge
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar endereço de pessoa', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const query = `
                UPDATE person_addresses
                SET 
                    street = COALESCE($1, street),
                    number = COALESCE($2, number),
                    complement = COALESCE($3, complement),
                    neighborhood = COALESCE($4, neighborhood),
                    city = COALESCE($5, city),
                    state = COALESCE($6, state),
                    postal_code = COALESCE($7, postal_code),
                    country = COALESCE($8, country),
                    reference = COALESCE($9, reference),
                    ibge = COALESCE($10, ibge)
                WHERE address_id = $11
                RETURNING *
            `;
            const values = [
                data.street,
                data.number,
                data.complement,
                data.neighborhood,
                data.city,
                data.state,
                data.postal_code,
                data.country,
                data.reference,
                data.ibge,
                id
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar endereço de pessoa', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            const query = 'DELETE FROM person_addresses WHERE address_id = $1';
            await this.pool.query(query, [id]);
        } catch (error) {
            logger.error('Erro ao deletar endereço de pessoa', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = new PersonAddressRepository();
