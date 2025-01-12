module.exports = class INuvemFiscalTokenRepository {
  /**
   * Obtém um token válido para o ambiente especificado
   * @param {string} ambiente - Ambiente do token (HOMOLOGACAO ou PRODUCAO)
   * @returns {Promise<Object|null>} Token válido ou null
   */
  async obterTokenValido(ambiente) {
    throw new Error('Método obterTokenValido deve ser implementado');
  }

  /**
   * Cria um novo token no repositório
   * @param {Object} tokenData - Dados do token
   * @param {string} tokenData.access_token - Token de acesso
   * @param {number} tokenData.expires_in - Tempo de expiração em segundos
   * @param {string} tokenData.environment - Ambiente do token
   * @returns {Promise<Object>} Token criado
   */
  async criarToken(tokenData) {
    throw new Error('Método criarToken deve ser implementado');
  }

  /**
   * Invalida um token específico
   * @param {number} tokenId - ID do token
   * @returns {Promise<void>}
   */
  async invalidarToken(tokenId) {
    throw new Error('Método invalidarToken deve ser implementado');
  }
};
