/**
 * Processa os parâmetros de paginação da requisição
 * @param {Object} query - Query params da requisição
 * @returns {Object} Objeto com parâmetros de paginação processados
 */
function getPaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;
    
    return {
        page,
        limit,
        offset
    };
}

/**
 * Gera os metadados da paginação
 * @param {number} total - Total de registros
 * @param {number} limit - Limite por página
 * @param {number} currentPage - Página atual
 * @returns {Object} Objeto com metadados da paginação
 */
function getPaginationMetadata(total, limit, currentPage) {
    const totalPages = Math.ceil(total / limit);
    
    return {
        total,
        pages: totalPages,
        current_page: currentPage,
        per_page: limit
    };
}

module.exports = {
    getPaginationParams,
    getPaginationMetadata
};
