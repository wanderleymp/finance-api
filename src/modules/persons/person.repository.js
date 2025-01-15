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

    async findPersonWithDetails(personId) {
        try {
            const personQuery = `
                SELECT 
                    p.person_id, 
                    p.full_name, 
                    p.fantasy_name, 
                    p.birth_date, 
                    p.person_type as type,
                    p.created_at,
                    p.updated_at
                FROM persons p
                WHERE p.person_id = $1
            `;
            const personResult = await this.pool.query(personQuery, [personId]);
            
            if (personResult.rows.length === 0) {
                logger.warn('Pessoa não encontrada', { personId });
                return null;
            }

            const person = personResult.rows[0];

            const documentsQuery = `
                SELECT 
                    person_document_id,
                    person_id,
                    document_type,
                    document_value
                FROM person_documents
                WHERE person_id = $1
            `;
            const documentsResult = await this.pool.query(documentsQuery, [personId]);

            console.error('DEBUG Documentos da Pessoa', {
                personId,
                documentsQuery,
                documentsResultRows: documentsResult.rows,
                documentsResultRowCount: documentsResult.rowCount
            });

            const addressesQuery = `
                SELECT 
                    address_id,
                    person_id,
                    street,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state,
                    postal_code as zipcode,
                    country,
                    reference,
                    ibge
                FROM person_addresses
                WHERE person_id = $1
            `;
            const addressesResult = await this.pool.query(addressesQuery, [personId]);

            person.documents = documentsResult.rows.map(doc => ({
                id: doc.person_document_id,
                type: doc.document_type,
                value: doc.document_value
            }));

            person.addresses = addressesResult.rows.map(addr => ({
                id: addr.address_id,
                street: addr.street,
                number: addr.number,
                complement: addr.complement,
                neighborhood: addr.neighborhood,
                city: addr.city,
                state: addr.state,
                zipcode: addr.zipcode,
                country: addr.country,
                reference: addr.reference,
                ibge: addr.ibge
            }));

            logger.info('Documentos da Pessoa', {
                personId,
                documentosEncontrados: person.documents,
                quantidadeDocumentos: person.documents.length,
                enderecosEncontrados: person.addresses,
                quantidadeEnderecos: person.addresses.length
            });

            return person;
        } catch (error) {
            logger.error('Erro ao buscar detalhes da pessoa', {
                personId,
                error: error.message,
                errorStack: error.stack
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
                RETURNING 
                    person_id,
                    full_name,
                    birth_date,
                    person_type,
                    fantasy_name,
                    created_at,
                    updated_at
            `;

            const values = [
                id,
                ...Object.keys(data)
                    .filter(key => data[key] !== undefined)
                    .map(key => data[key])
            ];

            logger.debug('Repository: Atualizando pessoa', { 
                id, 
                data, 
                query, 
                values 
            });

            const result = await this.pool.query(query, values);
            
            if (result.rows.length === 0) {
                logger.warn('Repository: Nenhuma pessoa atualizada', { 
                    id, 
                    data 
                });
                return null;
            }

            const updatedPerson = PersonResponseDTO.fromDatabase(result.rows[0]);
            
            logger.info('Repository: Pessoa atualizada com sucesso', { 
                person: updatedPerson 
            });

            return updatedPerson;
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
                FROM person_addresses 
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

    async findDocumentsByPersonId(personId) {
        try {
            const query = `
                SELECT 
                    pd.person_document_id,
                    pd.person_id,
                    pd.document_type,
                    pd.document_value
                FROM person_documents pd
                WHERE pd.person_id = $1
            `;
            const result = await this.pool.query(query, [personId]);
            
            console.error('DEBUGGER DOCUMENTOS: Query e resultado', {
                query,
                personId,
                resultRows: result.rows,
                rowCount: result.rowCount
            });

            logger.debug('Documentos encontrados para pessoa (REPOSITORY)', {
                personId,
                rowCount: result.rowCount,
                rows: result.rows
            });

            console.error('DEBUGGER DOCUMENTOS: Conteúdo completo da query', {
                queryResult: JSON.stringify(result),
                resultKeys: Object.keys(result),
                rowsKeys: result.rows.map(row => Object.keys(row))
            });

            const documents = result.rows.map(row => ({
                id: row.person_document_id,
                type: row.document_type,
                value: row.document_value
            }));

            logger.info('Debug Documentos Pessoa', {
                personId,
                documentsCount: documents.length,
                documentsDetails: JSON.stringify(documents)
            });

            return documents || [];
        } catch (error) {
            logger.error('Erro ao buscar documentos da pessoa', {
                error: error.message,
                personId,
                errorStack: error.stack
            });
            
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                logger.warn('Tabela de documentos não encontrada, retornando lista vazia', { personId });
                return [];
            }

            throw error;
        }
    }

    async findPersonDocuments(personId) {
        try {
            const query = `
                SELECT 
                    pd.person_document_id as id,
                    pd.person_id,
                    pd.document_type as type,
                    pd.document_value as value
                FROM person_documents pd
                WHERE pd.person_id = $1
            `;
            const result = await this.pool.query(query, [personId]);
            
            logger.debug('Documentos encontrados para pessoa', {
                personId,
                rowCount: result.rowCount
            });

            return result.rows.map(row => ({
                id: row.id,
                type: row.type,
                value: row.value
            }));
        } catch (error) {
            logger.error('Erro ao buscar documentos da pessoa', {
                error: error.message,
                personId,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async findAddressesByPersonId(personId) {
        try {
            const AddressRepository = require('../addresses/address.repository');
            const addressRepository = new AddressRepository();
            
            const addresses = await addressRepository.findByPersonId(personId);
            
            logger.debug('Endereços encontrados para pessoa', {
                personId,
                rowCount: addresses.length,
                addresses
            });

            return addresses;
        } catch (error) {
            logger.error('Erro ao buscar endereços da pessoa', {
                error: error.message,
                personId
            });
            
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                logger.warn('Tabela de endereços não encontrada, retornando lista vazia', { personId });
                return [];
            }

            throw error;
        }
    }
}

module.exports = PersonRepository;
