const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(page = 1, limit = 10) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            const countQuery = 'SELECT COUNT(*) FROM persons';
            const dataQuery = 'SELECT * FROM persons ORDER BY created_at DESC LIMIT $1 OFFSET $2';
            
            logger.info('Executando consulta findAll paginada', { 
                query: dataQuery,
                page,
                limit: validLimit,
                offset
            });

            const [dataResult, countResult] = await Promise.all([
                systemDatabase.query(dataQuery, [validLimit, offset]),
                systemDatabase.query(countQuery)
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            logger.error('Erro detalhado ao buscar todas as pessoas', { 
                errorMessage: error.message,
                errorStack: error.stack,
                errorCode: error.code,
                errorName: error.name,
                query: 'findAll'
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
