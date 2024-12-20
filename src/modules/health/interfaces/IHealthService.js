/**
 * Interface for Health Service
 */
class IHealthService {
    /**
     * Check overall system health
     * @returns {Promise<Object>} Health status of all components
     */
    async checkHealth() {}

    /**
     * Check database health
     * @returns {Promise<Object>} Database health status
     */
    async checkDatabases() {}

    /**
     * Check system resources
     * @returns {Promise<Object>} System resources status
     */
    async checkSystem() {}

    /**
     * Check application status
     * @returns {Promise<Object>} Application status
     */
    async checkApplication() {}
}

module.exports = IHealthService;
