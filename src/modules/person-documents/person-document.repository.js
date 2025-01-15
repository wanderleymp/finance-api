const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');

class PersonDocumentRepository {
    constructor() {
        this.pool = systemDatabase.pool;
        this.table = 'person_documents';
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            const values = [];
            let paramCount = 1;

            // Construir cláusulas WHERE dinamicamente
            let whereClause = '';
            if (Object.keys(filters).length > 0) {
                whereClause = 'WHERE ' + Object.entries(filters)
                    .map(([key, value]) => {
                        values.push(value);
                        return `${this.table}.${key} = $${paramCount++}`;
                    })
                    .join(' AND ');
            }

            // Query para contar o total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.table}
                ${whereClause}
            `;

            // Query para buscar os dados
            const query = `
                SELECT ${this.table}.*
                FROM ${this.table}
                ${whereClause}
                ORDER BY person_document_id DESC
                LIMIT $${paramCount++} OFFSET $${paramCount++}
            `;

            // Adiciona parâmetros de paginação
            values.push(limit, offset);

            // Executa as queries
            const [data, countResult] = await Promise.all([
                this.pool.query(query, values),
                this.pool.query(countQuery, values.slice(0, -2)) // Remove os parâmetros de paginação
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
            logger.error('Erro ao buscar documentos', { error, page, limit, filters });
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = `
                SELECT ${this.table}.*, p.full_name as person_name
                FROM ${this.table}
                LEFT JOIN persons p ON p.person_id = ${this.table}.person_id
                WHERE ${this.table}.person_document_id = $1
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar documento por ID', { error, id });
            throw error;
        }
    }

    async findByPersonId(personId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            console.error('DEBUG findByPersonId - Parâmetros', {
                personId,
                page,
                limit,
                offset,
                table: this.table
            });

            // Query para buscar documentos
            const query = `
                SELECT 
                    person_document_id,
                    person_id,
                    document_type,
                    document_value
                FROM ${this.table}
                WHERE person_id = $1
                ORDER BY person_document_id DESC
            `;

            const result = await this.pool.query(query, [personId]);

            console.error('DEBUG findByPersonId - Resultados', {
                resultRows: result.rows,
                resultRowCount: result.rowCount
            });

            // Retornar documentos diretamente
            return result.rows.map(row => ({
                id: row.person_document_id,
                type: row.document_type,
                document_value: row.document_value
            }));
        } catch (error) {
            logger.error('Erro ao buscar documentos por pessoa', { 
                error: error.message, 
                personId, 
                page, 
                limit,
                errorStack: error.stack 
            });
            throw error;
        }
    }

    async findByTypeAndPerson(type, personId) {
        try {
            const query = `
                SELECT ${this.table}.*, p.full_name as person_name
                FROM ${this.table}
                LEFT JOIN persons p ON p.person_id = ${this.table}.person_id
                WHERE ${this.table}.document_type = $1 AND ${this.table}.person_id = $2
            `;

            const result = await this.pool.query(query, [type, personId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar documento por tipo e pessoa', { error, type, personId });
            throw error;
        }
    }

    async create(data) {
        try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`);

            const query = `
                INSERT INTO ${this.table} (${columns.join(', ')})
                VALUES (${placeholders.join(', ')})
                RETURNING *
            `;

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar documento', { error, data });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const setClause = columns
                .map((col, i) => `${this.table}.${col} = $${i + 1}`)
                .join(', ');

            const query = `
                UPDATE ${this.table}
                SET ${setClause}
                WHERE ${this.table}.person_document_id = $${values.length + 1}
                RETURNING *
            `;

            const result = await this.pool.query(query, [...values, id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar documento', { error, id, data });
            throw error;
        }
    }

    async delete(id) {
        try {
            const query = `
                DELETE FROM ${this.table}
                WHERE ${this.table}.person_document_id = $1
                RETURNING *
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir documento', { error, id });
            throw error;
        }
    }
}

module.exports = PersonDocumentRepository;
