const axios = require('axios');
const { logger } = require('../../../middlewares/logger');
const database = require('../../../config/database');
const temporaryTokenRepository = require('../../tokens/repositories/temporary-token.repository');

class NuvemFiscalTokenService {
  /**
   * Obtém as credenciais da Nuvem Fiscal do banco de dados
   * @returns {Promise<Object>} Credenciais da Nuvem Fiscal
   */
  async obterCredenciais() {
    try {
      const query = `
        SELECT 
          ic.credential_id,
          ic.client_id, 
          ic.client_secret
        FROM public.integration_credentials ic
        JOIN public.integrations i ON i.integration_id = ic.integration_id
        WHERE i.system_name = 'Nuvem Fiscal'
      `;

      const result = await database.systemDatabase.pool.query(query);

      if (result.rows.length === 0) {
        throw new Error('Credenciais da Nuvem Fiscal não encontradas');
      }

      const credenciais = result.rows[0];

      logger.info('Credenciais da Nuvem Fiscal obtidas', {
        clientId: credenciais.client_id ? 'PRESENTE' : 'AUSENTE'
      });

      return credenciais;
    } catch (error) {
      logger.error('Erro ao obter credenciais da Nuvem Fiscal', {
        error: error.message,
        stack: error.stack,
        query: query
      });
      throw error;
    }
  }

  /**
   * Obtém um token de acesso para a Nuvem Fiscal
   * @param {string} [ambiente='PRODUCAO'] - Ambiente do token
   * @returns {Promise<string>} Token de acesso
   */
  async obterToken(ambiente = 'PRODUCAO') {
    try {
      // Primeiro, busca as credenciais da Nuvem Fiscal
      const credenciais = await this.obterCredenciais();

      // Busca um token válido para essa credencial
      const tokenTemporario = await temporaryTokenRepository.findValidTokenByCredentialId(credenciais.credential_id);
      
      if (tokenTemporario) {
        logger.info('Token válido encontrado', { ambiente });
        return tokenTemporario.token;
      }

      // Se não há token válido, obtém novas credenciais
      const { client_id, client_secret } = credenciais;

      if (!client_id || !client_secret) {
        throw new Error('Credenciais da Nuvem Fiscal incompletas');
      }

      // Faz requisição para obter token
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

      // Salva o token no repositório de tokens temporários
      await temporaryTokenRepository.create({
        token: access_token,
        credentialId: credenciais.credential_id,
        expiresInSeconds: expires_in
      });

      logger.info('Novo token obtido da Nuvem Fiscal', { ambiente });

      return access_token;
    } catch (error) {
      logger.error('Erro ao obter token da Nuvem Fiscal', {
        error: error.message,
        stack: error.stack,
        ambiente
      });
      throw error;
    }
  }

  /**
   * Limpa o token em cache, invalidando-o
   * @param {string} [ambiente='HOMOLOGACAO'] - Ambiente do token
   */
  async limparTokenCache(ambiente = 'HOMOLOGACAO') {
    try {
      const tokenSalvo = await temporaryTokenRepository.findValidTokenByCredentialId(credenciais.credential_id);
      
      if (tokenSalvo) {
        await temporaryTokenRepository.invalidarToken(tokenSalvo.token_id);
      }
    } catch (error) {
      logger.error('Erro ao limpar token cache', {
        error: error.message,
        stack: error.stack,
        ambiente
      });
      throw error;
    }
  }
}

module.exports = new NuvemFiscalTokenService();
