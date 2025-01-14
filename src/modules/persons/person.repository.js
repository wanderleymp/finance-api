const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const IPersonRepository = require('./interfaces/person-repository.interface');
const { PersonResponseDTO, PersonDetailsResponseDTO } = require('./dto/person-response.dto');

class PersonRepository extends IPersonRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
        this.tableName = 'persons';
    }

    async findAll(filters = {}, page = 1, limit = 10, order = {}) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT DISTINCT
                    p.person_id,
                    p.full_name,
                    p.birth_date,
                    p.person_type,
                    p.fantasy_name,
                    p.created_at,
                    p.updated_at
                FROM ${this.tableName} p
                LEFT JOIN person_documents pd ON pd.person_id = p.person_id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtro por nome ou nome fantasia
            if (filters.search) {
                query += ` AND (
                    p.full_name ILIKE $${paramCount} 
                    OR p.fantasy_name ILIKE $${paramCount}
                    OR pd.document_value ILIKE $${paramCount}
                )`;
                params.push(`%${filters.search}%`);
                paramCount++;
            }

            // Filtro por tipo de pessoa
            if (filters.type) {
                query += ` AND p.person_type = $${paramCount}`;
                params.push(filters.type);
                paramCount++;
            }

            // Filtro por documento
            if (filters.document) {
                query += ` AND pd.document_value = $${paramCount}`;
                params.push(filters.document);
                paramCount++;
            }

            // Ordenação
            const orderField = order.field || 'created_at';
            const orderDirection = order.direction || 'DESC';
            const validFields = ['full_name', 'fantasy_name', 'created_at', 'updated_at', 'birth_date'];
            const validDirections = ['ASC', 'DESC'];
            
            if (!validFields.includes(orderField)) {
                throw new Error('Campo de ordenação inválido');
            }
            if (!validDirections.includes(orderDirection)) {
                throw new Error('Direção de ordenação inválida');
            }

            query += ` ORDER BY p.${orderField} ${orderDirection}`;

            // Paginação
            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            // Executa a query principal
            const result = await this.pool.query(query, params);

            // Conta o total de registros
            const countQuery = `
                SELECT COUNT(DISTINCT p.person_id) as total
                FROM ${this.tableName} p
                LEFT JOIN person_documents pd ON pd.person_id = p.person_id
                WHERE 1=1
                ${filters.search ? ' AND (p.full_name ILIKE $1 OR p.fantasy_name ILIKE $1 OR pd.document_value ILIKE $1)' : ''}
                ${filters.type ? ` AND p.person_type = $${filters.search ? '2' : '1'}` : ''}
                ${filters.document ? ` AND pd.document_value = $${filters.search && filters.type ? '3' : filters.search || filters.type ? '2' : '1'}` : ''}
            `;
            const countParams = [];
            if (filters.search) countParams.push(`%${filters.search}%`);
            if (filters.type) countParams.push(filters.type);
            if (filters.document) countParams.push(filters.document);
            
            const countResult = await this.pool.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);

            return {
                items: result.rows.map(row => PersonResponseDTO.fromDatabase(row)),
                meta: {
                    totalItems: total,
                    itemCount: result.rows.length,
                    itemsPerPage: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    currentPage: parseInt(page)
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar pessoas', { error: error.message, filters, page, limit, order });
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

    async findByCnpj(cnpj) {
        try {
            const query = `
                SELECT DISTINCT
                    p.person_id,
                    p.full_name,
                    p.birth_date,
                    p.person_type,
                    p.fantasy_name,
                    p.created_at,
                    p.updated_at
                FROM ${this.tableName} p
                INNER JOIN person_documents pd ON pd.person_id = p.person_id
                WHERE pd.document_type = 'CNPJ'
                AND pd.document_value = $1
            `;

            const { rows } = await this.pool.query(query, [cnpj]);
            return rows[0] ? new PersonResponseDTO(rows[0]) : null;
        } catch (error) {
            logger.error('Repository: Erro ao buscar pessoa por CNPJ', {
                cnpj,
                error: error.message
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
                        'address_id', a.address_id,
                        'person_id', a.person_id,
                        'street', a.street,
                        'number', a.number,
                        'complement', a.complement,
                        'neighborhood', a.neighborhood,
                        'city', a.city,
                        'state', a.state,
                        'postal_code', a.postal_code,
                        'country', a.country,
                        'reference', a.reference,
                        'ibge', a.ibge
                    )) as addresses,
                    json_agg(DISTINCT jsonb_build_object(
                        'contact_id', c.contact_id,
                        'contact_value', c.contact_value,
                        'contact_name', c.contact_name,
                        'contact_type', c.contact_type
                    )) as contacts,
                    json_agg(DISTINCT jsonb_build_object(
                        'person_document_id', pd.person_document_id,
                        'document_type', pd.document_type,
                        'document_value', pd.document_value
                    )) as documents
                FROM ${this.tableName} p
                LEFT JOIN person_addresses a ON a.person_id = p.person_id
                LEFT JOIN person_contacts pc ON pc.person_id = p.person_id
                LEFT JOIN contacts c ON c.contact_id = pc.contact_id
                LEFT JOIN person_documents pd ON pd.person_id = p.person_id
                WHERE p.person_id = $1
                GROUP BY p.person_id
            `;
            const result = await this.pool.query(query, [id]);
            
            if (!result.rows[0]) return null;

            logger.debug('Consulta de detalhes da pessoa', { query, id, result: JSON.stringify(result.rows) });

            const personWithDetails = result.rows[0];
            personWithDetails.addresses = personWithDetails.addresses[0].address_id ? personWithDetails.addresses : [];
            personWithDetails.contacts = personWithDetails.contacts[0].contact_id ? personWithDetails.contacts : [];
            personWithDetails.documents = personWithDetails.documents[0].person_document_id ? personWithDetails.documents : [];

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
                    active
                ) VALUES (
                    $1, $2, $3, $4, $5
                ) RETURNING *
            `;
            const values = [
                data.full_name,
                data.birth_date,
                data.person_type,
                data.fantasy_name,
                data.active
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
            logger.info('Repository: Adicionando endereço à pessoa', { personId, addressData });

            const AddressRepository = require('../addresses/address.repository');
            const addressRepository = new AddressRepository();

            // Adiciona o person_id ao endereço
            addressData.person_id = personId;

            // Cria o endereço
            const newAddress = await addressRepository.create(addressData);

            logger.info('Repository: Endereço adicionado à pessoa', { 
                personId, 
                addressId: newAddress.id 
            });

            return newAddress;
        } catch (error) {
            logger.error('Repository: Erro ao adicionar endereço à pessoa', {
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
     * Adiciona um documento a uma pessoa
     * @param {number} personId - ID da pessoa
     * @param {Object} documentData - Dados do documento
     * @returns {Promise<Object>}
     */
    async addDocument(personId, documentData) {
        try {
            logger.info('Repository: Adicionando documento à pessoa', { personId, documentData });

            const DocumentRepository = require('../documents/document.repository');
            const documentRepository = new DocumentRepository();

            // Adiciona o person_id ao documento
            documentData.person_id = personId;

            // Cria o documento
            const newDocument = await documentRepository.create(documentData);

            logger.info('Repository: Documento adicionado à pessoa', { 
                personId, 
                documentId: newDocument.id 
            });

            return newDocument;
        } catch (error) {
            logger.error('Repository: Erro ao adicionar documento à pessoa', {
                error: error.message,
                personId,
                documentData
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
