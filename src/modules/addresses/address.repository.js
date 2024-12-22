const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const IAddressRepository = require('./interfaces/address-repository.interface');
const AddressResponseDTO = require('./dto/address-response.dto');

class AddressRepository extends IAddressRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
        this.tableName = 'person_addresses';
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            let query = `
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
                    ibge,
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

            if (filters.city) {
                query += ` AND city ILIKE $${paramCount}`;
                params.push(`%${filters.city}%`);
                paramCount++;
            }

            if (filters.state) {
                query += ` AND state = $${paramCount}`;
                params.push(filters.state);
                paramCount++;
            }

            const countQuery = query.replace('*', 'COUNT(*) as total');
            query += ` ORDER BY address_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, params),
                this.pool.query(countQuery, params.slice(0, -2))
            ]);

            return {
                data: dataResult.rows.map(AddressResponseDTO.fromDatabase),
                total: parseInt(countResult.rows[0].total),
                page,
                limit
            };
        } catch (error) {
            logger.error('Erro ao buscar endereços', {
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
                    ibge,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE address_id = $1
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0] ? AddressResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao buscar endereço por ID', {
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
                    ibge,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE person_id = $1
                ORDER BY address_id DESC
            `;
            const result = await this.pool.query(query, [personId]);
            return result.rows.map(AddressResponseDTO.fromDatabase);
        } catch (error) {
            logger.error('Erro ao buscar endereços da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async findMainAddressByPersonId(personId) {
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
                    ibge,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE person_id = $1
                LIMIT 1
            `;
            const result = await this.pool.query(query, [personId]);
            return result.rows[0] ? AddressResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao buscar endereço principal da pessoa', {
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
                    street,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state,
                    postal_code, 
                    country, 
                    reference, 
                    ibge,
                    created_at,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
                ) RETURNING *
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
                data.country,
                data.reference,
                data.ibge
            ];

            const result = await this.pool.query(query, values);
            return AddressResponseDTO.fromDatabase(result.rows[0]);
        } catch (error) {
            logger.error('Erro ao criar endereço', {
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
                WHERE address_id = $1
                RETURNING *
            `;

            const values = [
                id,
                ...Object.keys(data)
                    .filter(key => data[key] !== undefined)
                    .map(key => data[key])
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0] ? AddressResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao atualizar endereço', {
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
                WHERE address_id = $1
                RETURNING *
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0] ? AddressResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao deletar endereço', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = AddressRepository;
