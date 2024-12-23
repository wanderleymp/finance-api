const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class UserRepository extends BaseRepository {
    constructor() {
        super('users', 'user_id');
    }

    async findById(id) {
        try {
            const query = {
                text: `SELECT * FROM ${this.tableName} WHERE user_id = $1`,
                values: [id]
            };
            const { rows } = await this.pool.query(query);
            return rows[0] || null;
        } catch (error) {
            logger.error('Error finding user by ID', { error: error.message, id });
            throw error;
        }
    }

    async findByUsername(username) {
        try {
            const query = {
                text: `SELECT * FROM ${this.tableName} WHERE username = $1`,
                values: [username]
            };
            const { rows } = await this.pool.query(query);
            return rows[0] || null;
        } catch (error) {
            logger.error('Error finding user by username', { error: error.message, username });
            throw error;
        }
    }

    async create(data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const columns = fields.join(', ');
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

            const query = {
                text: `
                    INSERT INTO ${this.tableName} (${columns})
                    VALUES (${placeholders})
                    RETURNING user_id
                `,
                values
            };

            const { rows } = await this.pool.query(query);
            return this.findById(rows[0].user_id);
        } catch (error) {
            logger.error('Error creating user', { error: error.message });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);

            // Construir a cláusula SET
            const setClause = fields
                .map((field, index) => `${field} = $${index + 1}`)
                .join(', ');

            const query = {
                text: `
                    UPDATE ${this.tableName}
                    SET ${setClause}, updated_at = NOW()
                    WHERE user_id = $${fields.length + 1}
                    RETURNING user_id
                `,
                values: [...values, id]
            };

            const { rows } = await this.pool.query(query);
            return rows[0] ? this.findById(rows[0].user_id) : null;
        } catch (error) {
            logger.error('Error updating user', { error: error.message, id });
            throw error;
        }
    }

    async delete(id) {
        try {
            const query = {
                text: `DELETE FROM ${this.tableName} WHERE user_id = $1`,
                values: [id]
            };
            await this.pool.query(query);
        } catch (error) {
            logger.error('Error deleting user', { error: error.message, id });
            throw error;
        }
    }

    async list(options) {
        try {
            const { filters = {}, page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            // Preparar filtros
            const values = [];
            const conditions = [];
            let paramCount = 1;

            if (filters.username) {
                conditions.push(`username ILIKE $${paramCount}`);
                values.push(`%${filters.username}%`);
                paramCount++;
            }

            if (filters.active !== undefined) {
                conditions.push(`active = $${paramCount}`);
                values.push(filters.active);
                paramCount++;
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Adicionar LIMIT e OFFSET aos valores
            values.push(limit, offset);

            const listQuery = {
                text: `
                    SELECT *
                    FROM ${this.tableName}
                    ${whereClause}
                    ORDER BY user_id
                    LIMIT $${paramCount} 
                    OFFSET $${paramCount + 1}
                `,
                values
            };

            const countQuery = {
                text: `
                    SELECT COUNT(*) as count
                    FROM ${this.tableName}
                    ${whereClause}
                `,
                values: [...values.slice(0, -2)]
            };

            const [{ rows }, { rows: [{ count }] }] = await Promise.all([
                this.pool.query(listQuery),
                this.pool.query(countQuery)
            ]);

            return { rows, count: parseInt(count) };
        } catch (error) {
            logger.error('Error listing users', { error: error.message });
            throw error;
        }
    }

    async updateRefreshToken(userId, refreshToken) {
        try {
            const query = {
                text: `
                    UPDATE ${this.tableName}
                    SET refresh_token = $1, updated_at = NOW()
                    WHERE user_id = $2
                    RETURNING user_id
                `,
                values: [refreshToken, userId]
            };

            const { rows } = await this.pool.query(query);
            return rows[0] ? this.findById(rows[0].user_id) : null;
        } catch (error) {
            logger.error('Error updating refresh token', { error: error.message, userId });
            throw error;
        }
    }
}

module.exports = UserRepository;
