const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(page = 1, limit = 10, search = '') {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
            const offset = (validPage - 1) * validLimit;

            let whereClause = '';
            const queryParams = [];
            let paramCount = 1;

            if (search && search.trim()) {
                whereClause = `
                    WHERE (
                        LOWER(full_name) LIKE LOWER($${paramCount})
                        OR LOWER(fantasy_name) LIKE LOWER($${paramCount})
                        OR EXISTS (
                            SELECT 1 FROM person_documents pd 
                            WHERE pd.person_id = persons.person_id 
                            AND LOWER(pd.document_value) LIKE LOWER($${paramCount})
                        )
                    )
                `;
                queryParams.push(`%${search.trim()}%`);
                paramCount++;
            }

            const countQuery = `
                SELECT COUNT(*) 
                FROM persons 
                ${whereClause}
            `;

            const dataQuery = `
                SELECT * FROM persons 
                ${whereClause}
                ORDER BY full_name ASC 
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;
            queryParams.push(validLimit, offset);

            logger.info('Executando consulta findAll paginada', { 
                dataQuery,
                countQuery,
                params: queryParams.map((p, i) => `$${i + 1}: ${p}`),
                whereClause,
                searchTerm: search || null
            });
            
            const [dataResult, countResult] = await Promise.all([
                systemDatabase.query(dataQuery, queryParams),
                systemDatabase.query(countQuery, queryParams.slice(0, -2))
            ]);

            const data = dataResult.rows;
            const total = parseInt(countResult.rows[0].count);

            console.log('Resultado findAll:', { data, total });
            
            return {
                data,
                total
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
            return {
                data: rows[0] || null,
                total: rows.length
            };
        } catch (error) {
            logger.error('Erro ao buscar pessoa por ID', { 
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async findPersonById(personId, client = null) {
        try {
            const dbClient = client || systemDatabase;
            const query = `
                SELECT p.*, 
                    (SELECT json_agg(pd.*) FROM person_documents pd WHERE pd.person_id = p.person_id) as documents,
                    (SELECT json_agg(pc.*) FROM person_contacts pc WHERE pc.person_id = p.person_id) as contacts,
                    (SELECT json_agg(pa.*) FROM person_addresses pa WHERE pa.person_id = p.person_id) as addresses
                FROM persons p
                WHERE p.person_id = $1
            `;
            const { rows } = await dbClient.query(query, [personId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar pessoa por ID com relacionamentos', { 
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async create(personData) {
        const { 
            full_name, 
            birth_date = null, 
            person_type = 'PJ', 
            fantasy_name = null 
        } = personData;

        try {
            console.error(' REPOSITÓRIO: Criando pessoa', {
                full_name, 
                birth_date, 
                person_type, 
                fantasy_name,
                personDataFull: JSON.stringify(personData, null, 2)
            });

            // Conversões explícitas e validações
            const safePersonData = {
                full_name: String(full_name || '').trim(),
                birth_date: birth_date ? new Date(birth_date) : null,
                person_type: String(person_type || 'PJ').trim(),
                fantasy_name: String(fantasy_name || '').trim() || null
            };

            console.error(' REPOSITÓRIO: Dados seguros', {
                safePersonData: JSON.stringify(safePersonData, null, 2)
            });

            const query = `
                INSERT INTO persons 
                (full_name, birth_date, person_type, fantasy_name) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
            `;
            
            console.error(' REPOSITÓRIO: Query de criação', { 
                queryParams: [
                    safePersonData.full_name, 
                    safePersonData.birth_date, 
                    safePersonData.person_type, 
                    safePersonData.fantasy_name
                ]
            });

            const { rows } = await systemDatabase.query(query, [
                safePersonData.full_name, 
                safePersonData.birth_date, 
                safePersonData.person_type, 
                safePersonData.fantasy_name
            ]);

            console.error(' REPOSITÓRIO: Resultado da criação', { 
                rows: JSON.stringify(rows, null, 2)
            });

            return rows[0];
        } catch (error) {
            console.error(' REPOSITÓRIO: Erro ao criar pessoa', {
                error: error.message,
                errorStack: error.stack,
                personData: JSON.stringify(personData, null, 2)
            });
            throw error;
        }
    }

    async update(personId, personData) {
        const {
            full_name,
            birth_date,
            person_type,
            fantasy_name,
            active
        } = personData;

        const client = await systemDatabase.getClient();

        try {
            await client.query('BEGIN');

            // Verificar se a pessoa existe antes de atualizar
            const existCheckQuery = 'SELECT * FROM persons WHERE person_id = $1';
            const existCheckResult = await client.query(existCheckQuery, [personId]);
            
            if (existCheckResult.rows.length === 0) {
                throw new ValidationError('Pessoa não encontrada', 404);
            }

            const query = `
                UPDATE persons 
                SET 
                    full_name = COALESCE($1, full_name), 
                    birth_date = COALESCE($2, birth_date), 
                    person_type = COALESCE($3, person_type), 
                    fantasy_name = COALESCE($4, fantasy_name),
                    active = COALESCE($5, active),
                    updated_at = NOW()
                WHERE person_id = $6
                RETURNING *
            `;
            
            const { rows } = await client.query(query, [
                full_name,
                birth_date,
                person_type,
                fantasy_name,
                active,
                personId
            ]);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao atualizar pessoa', {
                error: error.message,
                personId,
                personData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async updatePerson(personId, personData, client = null) {
        try {
            const dbClient = client || systemDatabase;

            const {
                full_name,
                birth_date,
                person_type,
                fantasy_name,
                active
            } = personData;

            const query = `
                UPDATE persons 
                SET 
                    full_name = COALESCE($1, full_name), 
                    birth_date = COALESCE($2, birth_date), 
                    person_type = COALESCE($3, person_type), 
                    fantasy_name = COALESCE($4, fantasy_name),
                    active = COALESCE($5, active),
                    updated_at = NOW()
                WHERE person_id = $6
                RETURNING *
            `;
            
            const { rows } = await dbClient.query(query, [
                full_name,
                birth_date,
                person_type,
                fantasy_name,
                active,
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
