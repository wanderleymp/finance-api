const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const IPersonRepository = require('./interfaces/person-repository.interface');
const PersonResponseDTO = require('./dto/person-response.dto');

class PersonRepository extends IPersonRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
        this.tableName = 'persons';
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    person_id,
                    full_name,
                    birth_date,
                    person_type,
                    fantasy_name,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.name) {
                query += ` AND (full_name ILIKE $${paramCount} OR fantasy_name ILIKE $${paramCount})`;
                params.push(`%${filters.name}%`);
                paramCount++;
            }

            if (filters.type) {
                query += ` AND person_type = $${paramCount}`;
                params.push(filters.type);
                paramCount++;
            }

            // Adiciona ordenação e paginação
            query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const result = await this.pool.query(query, params);
            return result.rows.map(row => PersonResponseDTO.fromDatabase(row));
        } catch (error) {
            logger.error('Erro ao buscar pessoas', { error: error.message, filters });
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = `
                SELECT 
                    person_id,
                    full_name,
                    birth_date,
                    person_type,
                    fantasy_name,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE person_id = $1
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0] ? PersonResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao buscar pessoa por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByDocument(document) {
        try {
            const query = `
                SELECT 
                    person_id,
                    full_name,
                    birth_date,
                    person_type,
                    fantasy_name,
                    created_at,
                    updated_at
                FROM ${this.tableName}
                WHERE document = $1
            `;
            const result = await this.pool.query(query, [document]);
            return result.rows[0] ? PersonResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao buscar pessoa por documento', {
                error: error.message,
                document
            });
            throw error;
        }
    }

    async findPersonWithDetails(id) {
        try {
            const query = `
                SELECT 
                    p.person_id,
                    p.full_name,
                    p.birth_date,
                    p.person_type,
                    p.fantasy_name,
                    p.created_at,
                    p.updated_at,
                    json_agg(DISTINCT jsonb_build_object(
                        'address_id', a.id,
                        'street', a.street,
                        'number', a.number,
                        'complement', a.complement,
                        'neighborhood', a.neighborhood,
                        'city', a.city,
                        'state', a.state,
                        'zip_code', a.zip_code,
                        'is_main', a.is_main
                    )) as addresses,
                    json_agg(DISTINCT jsonb_build_object(
                        'contact_id', c.id,
                        'type', c.type,
                        'contact', c.contact,
                        'is_main', c.is_main
                    )) as contacts
                FROM ${this.tableName} p
                LEFT JOIN addresses a ON a.person_id = p.person_id
                LEFT JOIN person_contacts c ON c.person_id = p.person_id
                WHERE p.person_id = $1
                GROUP BY p.person_id
            `;
            const result = await this.pool.query(query, [id]);
            
            if (!result.rows[0]) return null;

            const personWithDetails = result.rows[0];
            personWithDetails.addresses = personWithDetails.addresses[0].address_id ? personWithDetails.addresses : [];
            personWithDetails.contacts = personWithDetails.contacts[0].contact_id ? personWithDetails.contacts : [];

            return PersonResponseDTO.fromDatabase(personWithDetails);
        } catch (error) {
            logger.error('Erro ao buscar detalhes da pessoa', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const query = `
                INSERT INTO ${this.tableName} (
                    full_name, 
                    birth_date, 
                    person_type,
                    fantasy_name,
                    is_active
                ) VALUES (
                    $1, $2, $3, $4, $5
                ) RETURNING *
            `;
            const values = [
                data.full_name,
                data.birth_date,
                data.person_type,
                data.fantasy_name,
                data.is_active
            ];

            const result = await this.pool.query(query, values);
            return PersonResponseDTO.fromDatabase(result.rows[0]);
        } catch (error) {
            logger.error('Erro ao criar pessoa', {
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
                WHERE person_id = $1
                RETURNING *
            `;

            const values = [
                id,
                ...Object.keys(data)
                    .filter(key => data[key] !== undefined)
                    .map(key => data[key])
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0] ? PersonResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao atualizar pessoa', {
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
                WHERE person_id = $1
                RETURNING *
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0] ? PersonResponseDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao deletar pessoa', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Adiciona um endereço a uma pessoa
     * @param {number} personId - ID da pessoa
     * @param {Object} addressData - Dados do endereço
     * @returns {Promise<Object>}
     */
    async addAddress(personId, addressData) {
        try {
            const query = `
                INSERT INTO addresses (
                    person_id, 
                    street, 
                    number, 
                    complement, 
                    neighborhood, 
                    city, 
                    state, 
                    zip_code,
                    is_main
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9
                ) RETURNING *
            `;

            const values = [
                personId,
                addressData.street,
                addressData.number,
                addressData.complement || null,
                addressData.neighborhood,
                addressData.city,
                addressData.state,
                addressData.zip_code,
                addressData.is_main || false
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao adicionar endereço à pessoa', {
                error: error.message,
                personId,
                addressData
            });
            throw error;
        }
    }

    /**
     * Adiciona um contato a uma pessoa
     * @param {number} personId - ID da pessoa
     * @param {Object} contactData - Dados do contato
     * @returns {Promise<Object>}
     */
    async addContact(personId, contactData) {
        try {
            const query = `
                INSERT INTO person_contacts (
                    person_id, 
                    type, 
                    contact, 
                    is_main
                ) VALUES (
                    $1, $2, $3, $4
                ) RETURNING *
            `;

            const values = [
                personId,
                contactData.type,
                contactData.contact,
                contactData.is_main || false
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao adicionar contato à pessoa', {
                error: error.message,
                personId,
                contactData
            });
            throw error;
        }
    }

    /**
     * Remove um endereço de uma pessoa
     * @param {number} addressId - ID do endereço
     * @returns {Promise<Object|null>}
     */
    async removeAddress(addressId) {
        try {
            const query = `
                DELETE FROM addresses
                WHERE id = $1
                RETURNING *
            `;

            const result = await this.pool.query(query, [addressId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao remover endereço', {
                error: error.message,
                addressId
            });
            throw error;
        }
    }

    /**
     * Remove um contato de uma pessoa
     * @param {number} contactId - ID do contato
     * @returns {Promise<Object|null>}
     */
    async removeContact(contactId) {
        try {
            const query = `
                DELETE FROM person_contacts
                WHERE id = $1
                RETURNING *
            `;

            const result = await this.pool.query(query, [contactId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao remover contato', {
                error: error.message,
                contactId
            });
            throw error;
        }
    }

    /**
     * Verifica se uma pessoa tem dependências (endereços ou contatos)
     * @param {number} personId - ID da pessoa
     * @returns {Promise<boolean>}
     */
    async hasDependencies(personId) {
        try {
            const addressQuery = `
                SELECT COUNT(*) as address_count 
                FROM addresses 
                WHERE person_id = $1
            `;

            const contactQuery = `
                SELECT COUNT(*) as contact_count 
                FROM person_contacts 
                WHERE person_id = $1
            `;

            const [addressResult, contactResult] = await Promise.all([
                this.pool.query(addressQuery, [personId]),
                this.pool.query(contactQuery, [personId])
            ]);

            const addressCount = parseInt(addressResult.rows[0].address_count);
            const contactCount = parseInt(contactResult.rows[0].contact_count);

            return addressCount > 0 || contactCount > 0;
        } catch (error) {
            logger.error('Erro ao verificar dependências da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }
}

module.exports = PersonRepository;
