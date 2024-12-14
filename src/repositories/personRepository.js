const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(page = 1, limit = 10, search = '') {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let whereClause = '';
            let queryParams = [];
            
            if (search && search.trim()) {
                whereClause = `
                    WHERE (
                        LOWER(full_name) LIKE LOWER($1)
                        OR LOWER(fantasy_name) LIKE LOWER($1)
                        OR EXISTS (
                            SELECT 1 FROM person_documents pd 
                            WHERE pd.person_id = persons.person_id 
                            AND LOWER(pd.document_value) LIKE LOWER($1)
                        )
                    )
                `;
                queryParams = [`%${search.trim()}%`];
            }
            
            const countQuery = `
                SELECT COUNT(*) 
                FROM persons 
                ${whereClause}
            `;

            // Executa a query de contagem primeiro
            const { rows: [{ count }] } = await systemDatabase.query(countQuery, queryParams);

            // Adiciona limit e offset para a query de dados
            queryParams.push(validLimit, offset);
            
            const dataQuery = `
                SELECT * FROM persons 
                ${whereClause}
                ORDER BY full_name ASC 
                LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
            `;
            
            logger.info('Executando consulta findAll paginada', { 
                dataQuery,
                countQuery,
                params: queryParams.map((p, i) => `$${i + 1}: ${p}`),
                whereClause,
                searchTerm: search || null
            });
            
            const { rows: data } = await systemDatabase.query(dataQuery, queryParams);
            
            return {
                data,
                total: parseInt(count)
            };
        } catch (error) {
            logger.error('Erro ao executar findAll', {
                error: error.message,
                stack: error.stack,
                searchTerm: search || null
            });
            throw error;
        }
    }

    async findById(personId) {
        try {
            const query = 'SELECT * FROM persons WHERE person_id = $1';
            const { rows } = await systemDatabase.query(query, [personId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar pessoa por ID', { 
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async create(personData) {
        const { 
            full_name, 
            birth_date, 
            person_type = 'PJ', 
            fantasy_name 
        } = personData;

        try {
            const query = `
                INSERT INTO persons 
                (full_name, birth_date, person_type, fantasy_name) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
            `;
            const { rows } = await systemDatabase.query(query, [
                full_name, 
                birth_date, 
                person_type, 
                fantasy_name
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar pessoa', {
                error: error.message,
                personData
            });
            throw error;
        }
    }

    async update(personId, personData) {
        const {
            full_name,
            birth_date,
            person_type,
            fantasy_name
        } = personData;

        try {
            const query = `
                UPDATE persons 
                SET full_name = $1, 
                    birth_date = $2, 
                    person_type = $3, 
                    fantasy_name = $4,
                    updated_at = NOW()
                WHERE person_id = $5
                RETURNING *
            `;
            const { rows } = await systemDatabase.query(query, [
                full_name,
                birth_date,
                person_type,
                fantasy_name,
                personId
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar pessoa', {
                error: error.message,
                personId,
                personData
            });
            throw error;
        }
    }

    async delete(personId) {
        try {
            const query = 'DELETE FROM persons WHERE person_id = $1';
            await systemDatabase.query(query, [personId]);
            return true;
        } catch (error) {
            logger.error('Erro ao deletar pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }
}

module.exports = new PersonRepository();
