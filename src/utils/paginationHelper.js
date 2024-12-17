const { ValidationError } = require('./errors');
const { logger } = require('../middlewares/logger');

class PaginationHelper {
    /**
     * Validates and normalizes pagination parameters
     * @param {number|string} page - Page number
     * @param {number|string} limit - Items per page
     * @returns {Object} Normalized pagination parameters
     */
    static validateParams(page = 1, limit = 10) {
        const normalizedPage = parseInt(page);
        const normalizedLimit = parseInt(limit);

        if (isNaN(normalizedPage) || normalizedPage < 1) {
            throw new ValidationError('Página inválida', 400);
        }

        if (isNaN(normalizedLimit) || normalizedLimit < 1) {
            throw new ValidationError('Limite por página inválido', 400);
        }

        return { page: normalizedPage, limit: normalizedLimit };
    }

    /**
     * Generates pagination SQL parameters
     * @param {number} page - Validated page number
     * @param {number} limit - Validated items per page
     * @returns {Object} SQL pagination parameters
     */
    static getPaginationParams(page, limit) {
        const offset = (page - 1) * limit;
        return { limit, offset };
    }

    /**
     * Formats the pagination response
     * @param {Array} data - Data records
     * @param {number} total - Total number of records
     * @param {number} page - Current page
     * @param {number} limit - Items per page
     * @returns {Object} Formatted pagination response
     */
    static formatResponse(data, total, page, limit) {
        const lastPage = Math.ceil(total / limit);
        const from = (page - 1) * limit + 1;
        const to = Math.min(page * limit, total);
        
        logger.info('Formatando resposta paginada', {
            totalRecords: total,
            currentPage: page,
            limit: limit
        });

        return {
            data: data,
            meta: {
                total,
                per_page: limit,
                current_page: page,
                last_page: lastPage,
                from,
                to
            }
        };
    }
}

module.exports = PaginationHelper;
