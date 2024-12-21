class ILoginAuditRepository {
    /**
     * Registra uma tentativa de login
     * @param {Object} data - Dados do login
     * @param {string} data.username - Nome do usuário
     * @param {boolean} data.success - Se o login foi bem sucedido
     * @param {string} data.ip - IP do usuário
     * @param {string} data.userAgent - User agent do navegador
     * @param {number} data.userId - ID do usuário
     */
    async create(data) {}

    /**
     * Busca tentativas falhas de login
     * @param {string} username - Nome do usuário
     * @param {number} minutes - Minutos para buscar
     * @returns {Promise<number>} Número de tentativas falhas
     */
    async getFailedAttempts(username, minutes) {}
}

module.exports = ILoginAuditRepository;
