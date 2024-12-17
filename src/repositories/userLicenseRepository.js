const { systemDatabase } = require('../config/database');
const { DatabaseError, ValidationError } = require('../utils/errors');
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
            console.log('REPOSITORY: Iniciando busca de licenças', { 
                userId, 
                options,
                userIdType: typeof userId,
                userIdValue: userId
            });

            // Validação de entrada
            if (!userId || isNaN(parseInt(userId))) {
                console.error('REPOSITORY: ID de usuário inválido', { 
                    userId, 
                    userIdType: typeof userId 
                });
                throw new ValidationError('ID de usuário inválido');
            }

            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            console.log('REPOSITORY: Parâmetros de paginação', { 
                page, 
                limit, 
                offset 
            });

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
                    l.timezone
                FROM user_license ul
                JOIN licenses l ON ul.license_id = l.license_id
                WHERE ul.user_id = $1
                LIMIT $2 OFFSET $3
            `;

            console.log('REPOSITORY: Executando query de contagem', { 
                countQuery, 
                userId: parseInt(userId) 
            });

            const countResult = await this.pool.query(countQuery, [parseInt(userId)]);
            const total = parseInt(countResult.rows[0].total);

            console.log('REPOSITORY: Resultado da contagem', { 
                total,
                countResultRows: countResult.rows 
            });

            console.log('REPOSITORY: Executando query de busca', { 
                query, 
                userId: parseInt(userId),
                limit,
                offset 
            });

            const result = await this.pool.query(query, [parseInt(userId), limit, offset]);

            console.log('REPOSITORY: Resultado da busca', { 
                resultRowCount: result.rows.length,
                resultRows: result.rows 
            });

            return {
                total,
                page,
                limit,
                data: result.rows
            };
        } catch (error) {
            console.error('REPOSITORY: Erro completo ao buscar licenças do usuário', { 
                userId,
                error: error.message,
                errorName: error.name,
                errorStack: error.stack,
                errorCode: error.code 
            });

            logger.error('REPOSITORY: Erro ao buscar licenças do usuário', { 
                userId,
                error: error.message,
                errorCode: error.code 
            });
            throw error;
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

    async update(userId, licenseId, updateData) {
        try {
            const allowedFields = ['status', 'active'];
            const updateFields = Object.keys(updateData).filter(field => allowedFields.includes(field));

            if (updateFields.length === 0) {
                logger.warn('REPOSITORY: Nenhum campo válido para atualização', { 
                    userId, 
                    licenseId, 
                    updateData 
                });
                return null;
            }

            const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
            const values = [
                userId, 
                licenseId, 
                ...updateFields.map(field => updateData[field])
            ];

            const query = `
                UPDATE user_license ul
                SET ${setClause}
                FROM licenses l
                WHERE ul.license_id = l.license_id
                AND ul.user_id = $1 
                AND ul.license_id = $2
                RETURNING ul.*, l.license_name
            `;

            const result = await this.pool.query(query, values);

            if (result.rows.length === 0) {
                logger.info('REPOSITORY: Nenhuma licença atualizada', { 
                    userId, 
                    licenseId 
                });
                return null;
            }

            logger.info('REPOSITORY: Licença de usuário atualizada', { 
                userId, 
                licenseId, 
                updatedFields: updateFields 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('REPOSITORY: Erro ao atualizar licença de usuário', { 
                error: error.message, 
                userId,
                licenseId,
                updateData,
                errorCode: error.code,
                errorDetail: error.detail
            });

            throw new DatabaseError('Erro ao atualizar associação usuário-licença');
        }
    }
}

module.exports = new UserLicenseRepository();
