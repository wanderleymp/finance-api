const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class UserRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
        let query = `
            SELECT 
                u.user_id, 
                u.person_id, 
                u.profile_id, 
                u.username, 
                u.last_login, 
                u.active,
                u.created_at,
                u.updated_at,
                p.full_name AS person_name
            FROM users u
            JOIN persons p ON u.person_id = p.person_id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramCount = 1;

        // Filtros de busca
        if (filters.search) {
            query += ` AND (
                u.username ILIKE $${paramCount} OR 
                p.full_name ILIKE $${paramCount}
            )`;
            queryParams.push(`%${filters.search}%`);
            paramCount++;
        }

        if (filters.active !== undefined) {
            query += ` AND u.active = $${paramCount}`;
            queryParams.push(filters.active);
            paramCount++;
        }

        // Contagem total
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM users u
            JOIN persons p ON u.person_id = p.person_id
            WHERE 1=1
            ${filters.search ? `AND (u.username ILIKE $1 OR p.full_name ILIKE $1)` : ''}
            ${filters.active !== undefined ? `AND u.active = ${filters.active}` : ''}
        `;

        try {
            const totalResult = await this.pool.query(
                countQuery, 
                filters.search ? [`%${filters.search}%`] : []
            );
            const total = parseInt(totalResult.rows[0].total);

            // Adicionar paginação e ordenação
            query += ` 
                ORDER BY u.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;
            queryParams.push(validLimit, offset);

            const result = await this.pool.query(query, queryParams);

            return {
                data: result.rows,
                total: total
            };
        } catch (error) {
            logger.error('Erro ao buscar usuários', { 
                error: error.message,
                filters,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id) {
        const query = `
            SELECT 
                u.user_id, 
                u.person_id, 
                u.profile_id, 
                u.username, 
                u.last_login, 
                u.active,
                u.created_at,
                u.updated_at,
                p.full_name AS person_name
            FROM users u
            JOIN persons p ON u.person_id = p.person_id
            WHERE u.user_id = $1
        `;

        try {
            const result = await this.pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar usuário por ID', { 
                error: error.message,
                id 
            });
            throw error;
        }
    }

    async findByUsername(username) {
        const query = `
            SELECT 
                u.user_id, 
                u.person_id, 
                u.profile_id, 
                u.username, 
                u.password,
                u.last_login, 
                u.active,
                u.created_at,
                u.updated_at,
                p.full_name AS person_name
            FROM users u
            JOIN persons p ON u.person_id = p.person_id
            WHERE u.username = $1
        `;

        try {
            const result = await this.pool.query(query, [username]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar usuário por username', { 
                error: error.message,
                username 
            });
            throw error;
        }
    }

    async create(userData) {
        const { 
            username, 
            password, 
            person_id, 
            profile_id 
        } = userData;

        const query = `
            INSERT INTO users 
            (username, password, person_id, profile_id) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;

        const values = [
            username, 
            password, 
            person_id, 
            profile_id
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar usuário', { 
                error: error.message,
                userData: { 
                    username, 
                    person_id, 
                    profile_id 
                }
            });
            throw error;
        }
    }

    async update(userId, userData) {
        const { 
            username, 
            person_id, 
            profile_id, 
            active,
            password 
        } = userData;

        const query = `
            UPDATE users 
            SET 
                username = COALESCE($1, username),
                person_id = COALESCE($2, person_id),
                profile_id = COALESCE($3, profile_id),
                active = COALESCE($4, active),
                password = COALESCE($6, password),
                updated_at = NOW()
            WHERE user_id = $5
            RETURNING *
        `;

        const values = [
            username, 
            person_id, 
            profile_id, 
            active, 
            userId,
            password
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar usuário', { 
                error: error.message,
                userId,
                userData 
            });
            throw error;
        }
    }

    async findByPerson(personId) {
        const query = `
            SELECT 
                u.user_id, 
                u.person_id, 
                u.profile_id, 
                u.username, 
                u.last_login, 
                u.active,
                u.created_at,
                u.updated_at,
                p.full_name AS person_name
            FROM users u
            JOIN persons p ON u.person_id = p.person_id
            WHERE u.person_id = $1
        `;

        try {
            const result = await this.pool.query(query, [personId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar usuários por pessoa', { 
                error: error.message,
                personId 
            });
            throw error;
        }
    }
}

module.exports = new UserRepository();
