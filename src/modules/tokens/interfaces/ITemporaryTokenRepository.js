module.exports = class ITemporaryTokenRepository {
  /**
   * Cria um novo token temporário
   * @param {Object} tokenData - Dados do token
   * @returns {Promise<Object>} Token criado
   */
  async create(tokenData) {
    throw new Error('Método create deve ser implementado');
  }

  /**
   * Busca um token válido por credential_id
   * @param {number} credentialId - ID da credencial
   * @returns {Promise<Object|null>} Token válido ou null
   */
  async findValidTokenByCredentialId(credentialId) {
    throw new Error('Método findValidTokenByCredentialId deve ser implementado');
  }

  /**
   * Atualiza um token existente
   * @param {number} tokenId - ID do token
   * @param {Object} tokenData - Dados atualizados do token
   * @returns {Promise<Object>} Token atualizado
   */
  async update(tokenId, tokenData) {
    throw new Error('Método update deve ser implementado');
  }

  /**
   * Remove tokens expirados
   * @returns {Promise<number>} Número de tokens removidos
   */
  async removeExpiredTokens() {
    throw new Error('Método removeExpiredTokens deve ser implementado');
  }
};
