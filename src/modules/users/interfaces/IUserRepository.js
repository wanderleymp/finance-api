/**
 * Interface for User Repository
 */
class IUserRepository {
    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object>} User data
     */
    async findById(id) {}

    /**
     * Find user by username
     * @param {string} username - Username
     * @returns {Promise<Object>} User data
     */
    async findByUsername(username) {}

    /**
     * Create new user
     * @param {Object} data - User data
     * @returns {Promise<Object>} Created user
     */
    async create(data) {}

    /**
     * Update user
     * @param {number} id - User ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} Updated user
     */
    async update(id, data) {}

    /**
     * Delete user
     * @param {number} id - User ID
     * @returns {Promise<void>}
     */
    async delete(id) {}

    /**
     * List users with pagination
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Object>} Paginated list of users
     */
    async list(filters) {}
}

module.exports = IUserRepository;
