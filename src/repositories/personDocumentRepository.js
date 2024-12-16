const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonDocumentRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            let query = `
                SELECT pd.*, p.full_name as person_name 
                FROM person_documents pd
                LEFT JOIN persons p ON p.person_id = pd.person_id 
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            if (filters.person_id) {
                query += ` AND pd.person_id = $${paramCount}`;
                values.push(filters.person_id);
                paramCount++;
            }

            if (filters.document_type) {
                query += ` AND pd.document_type = $${paramCount}`;
                values.push(filters.document_type);
                paramCount++;
            }

            query += ` ORDER BY pd.person_document_id DESC`;

            const result = await this.pool.query(query, values);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar documentos de pessoas', {
                error: error.message,
                filters
            });
            throw error;
        }
    }

    async findById(documentId) {
        try {
            const query = `
                SELECT pd.*, p.full_name as person_name 
                FROM person_documents pd
                LEFT JOIN persons p ON p.person_id = pd.person_id 
                WHERE pd.person_document_id = $1
            `;
            const { rows } = await systemDatabase.query(query, [documentId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar documento por ID', { 
                errorMessage: error.message,
                errorStack: error.stack,
                documentId
            });
            throw error;
        }
    }

    async create(documentData) {
        const { person_id, document_type, document_value } = documentData;

        try {
            const query = `
                INSERT INTO person_documents 
                (person_id, document_type, document_value) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `;
            const { rows } = await systemDatabase.query(query, [
                person_id,
                document_type,
                document_value
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar documento', {
                error: error.message,
                documentData
            });
            throw error;
        }
    }

    async update(documentId, documentData) {
        const { document_type, document_value } = documentData;

        try {
            const query = `
                UPDATE person_documents 
                SET document_type = COALESCE($1, document_type),
                    document_value = COALESCE($2, document_value)
                WHERE person_document_id = $3
                RETURNING *
            `;
            const { rows } = await systemDatabase.query(query, [
                document_type,
                document_value,
                documentId
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar documento', {
                error: error.message,
                documentId,
                documentData
            });
            throw error;
        }
    }

    async delete(documentId) {
        try {
            const query = 'DELETE FROM person_documents WHERE person_document_id = $1 RETURNING *';
            const { rows } = await systemDatabase.query(query, [documentId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao deletar documento', {
                error: error.message,
                documentId
            });
            throw error;
        }
    }

    async findByPersonId(personId) {
        try {
            const query = 'SELECT * FROM person_documents WHERE person_id = $1';
            const { rows } = await systemDatabase.query(query, [personId]);
            return rows;
        } catch (error) {
            logger.error('Erro ao buscar documentos por pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }
}

module.exports = new PersonDocumentRepository();
