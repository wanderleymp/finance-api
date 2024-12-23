const { systemDatabase } = require('../../config/database');
const IUserRepository = require('./interfaces/IUserRepository');

class UserRepository extends IUserRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
    }

    async findById(id) {
        try {
            const result = await this.pool.query(
                `SELECT 
                    u.user_id,
                    u.username,
                    u.person_id,
                    u.profile_id,
                    u.enable_2fa,
                    u.last_login,
                    u.active,
                    u.created_at,
                    u.updated_at
                FROM users u
                WHERE u.user_id = $1`,
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    async findByUsername(username) {
        try {
            const result = await this.pool.query(
                `SELECT 
                    u.user_id,
                    u.username,
                    u.password,
                    u.person_id,
                    u.profile_id,
                    u.enable_2fa,
                    u.last_login,
                    u.active,
                    u.created_at,
                    u.updated_at
                FROM users u
                WHERE u.username = $1`,
                [username]
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    async create(data) {
        try {
            const result = await this.pool.query(
                `INSERT INTO users (
                    username,
                    password,
                    person_id,
                    profile_id,
                    enable_2fa,
                    active,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                RETURNING 
                    user_id,
                    username,
                    person_id,
                    profile_id,
                    enable_2fa,
                    active,
                    created_at,
                    updated_at`,
                [
                    data.username,
                    data.password,
                    data.person_id,
                    data.profile_id,
                    data.enable_2fa || false,
                    data.active || true
                ]
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    async update(id, data) {
        try {
            const setClause = [];
            const values = [];
            let paramCount = 1;

            // Construir cláusula SET dinamicamente
            if (data.username) {
                setClause.push(`username = $${paramCount}`);
                values.push(data.username);
                paramCount++;
            }
            if (data.password) {
                setClause.push(`password = $${paramCount}`);
                values.push(data.password);
                paramCount++;
            }
            if (data.profile_id) {
                setClause.push(`profile_id = $${paramCount}`);
                values.push(data.profile_id);
                paramCount++;
            }
            if (data.enable_2fa !== undefined) {
                setClause.push(`enable_2fa = $${paramCount}`);
                values.push(data.enable_2fa);
                paramCount++;
            }
            if (data.active !== undefined) {
                setClause.push(`active = $${paramCount}`);
                values.push(data.active);
                paramCount++;
            }
            if (data.last_login) {
                setClause.push(`last_login = $${paramCount}`);
                values.push(data.last_login);
                paramCount++;
            }

            setClause.push(`updated_at = NOW()`);

            // Adicionar ID do usuário como último parâmetro
            values.push(id);

            const result = await this.pool.query(
                `UPDATE users 
                SET ${setClause.join(', ')}
                WHERE user_id = $${paramCount}
                RETURNING 
                    user_id,
                    username,
                    person_id,
                    profile_id,
                    enable_2fa,
                    active,
                    last_login,
                    created_at,
                    updated_at`,
                values
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        try {
            await this.pool.query(
                'DELETE FROM users WHERE user_id = $1',
                [id]
            );
        } catch (error) {
            throw error;
        }
    }

    async list(filters) {
        try {
            const conditions = [];
            const values = [];
            let paramCount = 1;

            if (filters.username) {
                conditions.push(`u.username ILIKE $${paramCount}`);
                values.push(`%${filters.username}%`);
                paramCount++;
            }

            if (filters.profile_id) {
                conditions.push(`u.profile_id = $${paramCount}`);
                values.push(filters.profile_id);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            const result = await this.pool.query(
                `SELECT 
                    u.user_id,
                    u.username,
                    u.person_id,
                    u.profile_id,
                    u.enable_2fa,
                    u.active,
                    u.last_login,
                    u.created_at,
                    u.updated_at
                FROM users u
                ${whereClause}
                ORDER BY u.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
                [...values, filters.limit || 10, (filters.page - 1) * (filters.limit || 10)]
            );

            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UserRepository;
