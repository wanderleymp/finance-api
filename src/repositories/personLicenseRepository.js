const { systemDatabase } = require('../config/database');
const { DatabaseError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonLicenseRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async create(data) {
        try {
            // Verificar se a associação já existe antes de criar
            const licenseExists = await this.checkLicenseExists(data.person_id, data.license_id);
            
            if (licenseExists) {
                logger.warn('REPOSITORY: Tentativa de criar associação pessoa-licença duplicada', { 
                    personId: data.person_id, 
                    licenseId: data.license_id 
                });
                throw new DatabaseError('Associação pessoa-licença já existe');
            }

            const query = `
                INSERT INTO person_license (
                    person_id, 
                    license_id
                ) VALUES ($1, $2)
                RETURNING *
            `;
            const values = [
                data.person_id,
                data.license_id
            ];

            const result = await this.pool.query(query, values);
            
            logger.info('REPOSITORY: Pessoa-Licença criada', { 
                personId: data.person_id, 
                licenseId: data.license_id 
            });

            return result.rows[0];
        } catch (error) {
            // Se já for um erro de associação existente, relanças o mesmo
            if (error.message === 'Associação pessoa-licença já existe') {
                throw error;
            }

            logger.error('REPOSITORY: Erro ao criar pessoa-licença', { 
                error: error.message, 
                data,
                errorCode: error.code,
                errorDetail: error.detail
            });

            throw new DatabaseError('Erro ao criar associação pessoa-licença');
        }
    }

    async checkLicenseExists(personId, licenseId) {
        try {
            const query = `
                SELECT EXISTS(
                    SELECT 1 
                    FROM person_license 
                    WHERE person_id = $1 AND license_id = $2
                ) as license_exists
            `;

            const result = await this.pool.query(query, [personId, licenseId]);
            
            logger.info('REPOSITORY: Verificação de existência de licença', { 
                personId, 
                licenseId, 
                exists: result.rows[0].license_exists 
            });

            return result.rows[0].license_exists;
        } catch (error) {
            logger.error('REPOSITORY: Erro ao verificar existência de licença', { 
                error: error.message, 
                personId, 
                licenseId,
                errorCode: error.code 
            });
            throw new DatabaseError('Erro ao verificar existência de licença');
        }
    }

    async findByPerson(personId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM person_license pl
                JOIN licenses l ON pl.license_id = l.license_id
                WHERE pl.person_id = $1
            `;

            const query = `
                SELECT 
                    pl.person_id,
                    pl.license_id,
                    l.license_name,
                    l.start_date,
                    l.end_date,
                    l.status,
                    l.timezone,
                    l.active
                FROM person_license pl
                JOIN licenses l ON pl.license_id = l.license_id
                WHERE pl.person_id = $1
                LIMIT $2 OFFSET $3
            `;

            const countResult = await this.pool.query(countQuery, [personId]);
            const total = parseInt(countResult.rows[0].total);

            const result = await this.pool.query(query, [personId, limit, offset]);

            return {
                total,
                page,
                limit,
                data: result.rows
            };
        } catch (error) {
            logger.error('REPOSITORY: Erro ao buscar licenças da pessoa', { 
                error: error.message, 
                personId,
                errorCode: error.code 
            });
            throw new DatabaseError('Erro ao buscar licenças da pessoa');
        }
    }

    async findByLicense(licenseId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM person_license pl
                JOIN persons p ON pl.person_id = p.person_id
                WHERE pl.license_id = $1
            `;

            const query = `
                SELECT 
                    pl.person_id,
                    pl.license_id,
                    p.full_name,
                    p.email
                FROM person_license pl
                JOIN persons p ON pl.person_id = p.person_id
                WHERE pl.license_id = $1
                LIMIT $2 OFFSET $3
            `;

            const countResult = await this.pool.query(countQuery, [licenseId]);
            const total = parseInt(countResult.rows[0].total);

            const result = await this.pool.query(query, [licenseId, limit, offset]);

            return {
                total,
                page,
                limit,
                data: result.rows
            };
        } catch (error) {
            logger.error('REPOSITORY: Erro ao buscar pessoas da licença', { 
                error: error.message, 
                licenseId,
                errorCode: error.code 
            });
            throw new DatabaseError('Erro ao buscar pessoas da licença');
        }
    }

    async findAll(options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM person_license
            `;

            const query = `
                SELECT 
                    pl.person_id,
                    pl.license_id,
                    p.full_name as person_name,
                    l.license_name
                FROM person_license pl
                JOIN persons p ON pl.person_id = p.person_id
                JOIN licenses l ON pl.license_id = l.license_id
                LIMIT $1 OFFSET $2
            `;

            const countResult = await this.pool.query(countQuery);
            const total = parseInt(countResult.rows[0].total);

            const result = await this.pool.query(query, [limit, offset]);

            return {
                total,
                page,
                limit,
                data: result.rows
            };
        } catch (error) {
            logger.error('REPOSITORY: Erro ao buscar associações pessoa-licença', { 
                error: error.message,
                errorCode: error.code 
            });
            throw new DatabaseError('Erro ao buscar associações pessoa-licença');
        }
    }

    async delete(personId, licenseId) {
        try {
            const query = `
                DELETE FROM person_license 
                WHERE person_id = $1 AND license_id = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [personId, licenseId]);

            if (result.rowCount === 0) {
                logger.warn('REPOSITORY: Nenhuma associação encontrada para deleção', { 
                    personId, 
                    licenseId 
                });
                return null;
            }

            logger.info('REPOSITORY: Pessoa-Licença removida', { 
                personId, 
                licenseId 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('REPOSITORY: Erro ao remover associação pessoa-licença', { 
                error: error.message, 
                personId, 
                licenseId,
                errorCode: error.code 
            });
            throw new DatabaseError('Erro ao remover associação pessoa-licença');
        }
    }
}

module.exports = new PersonLicenseRepository();
