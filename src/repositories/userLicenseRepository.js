const { systemDatabase } = require('../config/database');
const { DatabaseError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class UserLicenseRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async create(data) {
        try {
            const query = `
                INSERT INTO user_license (
                    user_id, 
                    license_id
                ) VALUES ($1, $2)
                ON CONFLICT (user_id, license_id) DO NOTHING
                RETURNING *
            `;
            const values = [
                data.user_id,
                data.license_id
            ];

            const result = await this.pool.query(query, values);
            
            if (result.rows.length === 0) {
                logger.info('REPOSITORY: Associação usuário-licença já existe', { 
                    userId: data.user_id, 
                    licenseId: data.license_id 
                });
                return null;
            }

            logger.info('REPOSITORY: Usuário-Licença criada', { 
                userId: data.user_id, 
                licenseId: data.license_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('REPOSITORY: Erro ao criar usuário-licença', { 
                error: error.message, 
                data,
                errorCode: error.code,
                errorDetail: error.detail
            });

            throw new DatabaseError('Erro ao criar associação usuário-licença');
        }
    }

    async findByUser(userId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM user_license ul
                JOIN licenses l ON ul.license_id = l.license_id
                WHERE ul.user_id = $1
            `;

            const query = `
                SELECT 
                    ul.user_license_id,
                    ul.user_id,
                    ul.license_id,
                    l.license_name,
                    l.start_date,
                    l.end_date,
                    l.status,
                    l.timezone,
                    l.active
                FROM user_license ul
                JOIN licenses l ON ul.license_id = l.license_id
                WHERE ul.user_id = $1
                LIMIT $2 OFFSET $3
            `;

            const countResult = await this.pool.query(countQuery, [userId]);
            const total = parseInt(countResult.rows[0].total);

            const result = await this.pool.query(query, [userId, limit, offset]);

            return {
                total,
                page,
                limit,
                data: result.rows
            };
        } catch (error) {
            logger.error('REPOSITORY: Erro ao buscar licenças do usuário', { 
                error: error.message, 
                userId,
                errorCode: error.code 
            });
            throw new DatabaseError('Erro ao buscar licenças do usuário');
        }
    }

    async findByLicense(licenseId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM user_license ul
                JOIN users u ON ul.user_id = u.user_id
                WHERE ul.license_id = $1
            `;

            const query = `
                SELECT 
                    ul.user_license_id,
                    ul.user_id,
                    ul.license_id,
                    u.username,
                    u.email
                FROM user_license ul
                JOIN users u ON ul.user_id = u.user_id
                WHERE ul.license_id = $1
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
            logger.error('REPOSITORY: Erro ao buscar usuários da licença', { 
                error: error.message, 
                licenseId,
                errorCode: error.code 
            });
            throw new DatabaseError('Erro ao buscar usuários da licença');
        }
    }

    async findAll(options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM user_license
            `;

            const query = `
                SELECT 
                    ul.user_license_id,
                    ul.user_id,
                    ul.license_id,
                    u.username,
                    l.license_name
                FROM user_license ul
                JOIN users u ON ul.user_id = u.user_id
                JOIN licenses l ON ul.license_id = l.license_id
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
            logger.error('REPOSITORY: Erro ao buscar associações usuário-licença', { 
                error: error.message,
                errorCode: error.code 
            });
            throw new DatabaseError('Erro ao buscar associações usuário-licença');
        }
    }

    async delete(userId, licenseId) {
        try {
            const query = `
                DELETE FROM user_license 
                WHERE user_id = $1 AND license_id = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [userId, licenseId]);

            if (result.rowCount === 0) {
                logger.warn('REPOSITORY: Nenhuma associação encontrada para deleção', { 
                    userId, 
                    licenseId 
                });
                return null;
            }

            logger.info('REPOSITORY: Associação usuário-licença removida', { 
                userId, 
                licenseId 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('REPOSITORY: Erro ao remover associação usuário-licença', { 
                error: error.message, 
                userId, 
                licenseId,
                errorCode: error.code 
            });
            throw new DatabaseError('Erro ao remover associação usuário-licença');
        }
    }
}

module.exports = new UserLicenseRepository();
