const axios = require('axios');
const { logger } = require('../../../middlewares/logger');
const temporaryTokenRepository = require('../repositories/temporary-token.repository');
const { systemDatabase } = require('../../../config/database');

class TemporaryTokenService {
  /**
   * Obtém credenciais para um sistema específico
   * @param {string} systemName - Nome do sistema
   * @returns {Promise<Object>} Credenciais
   */
  async obterCredenciais(systemName) {
    try {
      const query = `
        SELECT 
          ic.credential_id,
          ic.client_id, 
          ic.client_secret
        FROM public.integration_credentials ic
        JOIN public.integrations i ON i.integration_id = ic.integration_id
        WHERE i.system_name = $1
      `;

      const result = await systemDatabase.pool.query(query, [systemName]);

      if (result.rows.length === 0) {
        throw new Error(`Credenciais para ${systemName} não encontradas`);
      }

      const credenciais = result.rows[0];

      logger.info('Credenciais obtidas', {
        systemName,
        credentialId: credenciais.credential_id
      });

      return credenciais;
    } catch (error) {
      logger.error('Erro ao obter credenciais', {
        error: error.message,
        systemName
      });
      throw error;
    }
  }

  /**
   * Obtém um token válido para um sistema
   * @param {string} systemName - Nome do sistema
   * @returns {Promise<string>} Token de acesso
   */
  async obterToken(systemName) {
    try {
      // Obtém credenciais
      const { credential_id, client_id, client_secret } = await this.obterCredenciais(systemName);

      // Verifica se já existe um token válido
      const tokenExistente = await temporaryTokenRepository.findValidTokenByCredentialId(credential_id);
      
      if (tokenExistente) {
        logger.info('Token válido encontrado', { systemName });
        return tokenExistente.token;
      }

      // Obtém novo token (exemplo para Nuvem Fiscal, adapte conforme necessário)
      const response = await axios.post(
        'https://auth.nuvemfiscal.com.br/oauth/token',
        {
          grant_type: 'client_credentials',
          client_id: client_id,
          client_secret: client_secret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const { access_token, expires_in } = response.data;

      // Salva token
      await temporaryTokenRepository.create({
        token: access_token,
        credentialId: credential_id,
        expiresInSeconds: expires_in
      });

      logger.info('Novo token obtido', { systemName });

      return access_token;
    } catch (error) {
      logger.error('Erro ao obter token', {
        error: error.message,
        systemName
      });
      throw error;
    }
  }

  /**
   * Remove tokens expirados
   * @returns {Promise<number>} Número de tokens removidos
   */
  async limparTokensExpirados() {
    try {
      const removedCount = await temporaryTokenRepository.removeExpiredTokens();
      
      logger.info('Limpeza de tokens expirados concluída', {
        tokensRemovidos: removedCount
      });

      return removedCount;
    } catch (error) {
      logger.error('Erro ao limpar tokens expirados', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new TemporaryTokenService();
