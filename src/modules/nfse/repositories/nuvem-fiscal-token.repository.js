const BaseRepository = require('../../../repositories/base/BaseRepository');
const INuvemFiscalTokenRepository = require('../interfaces/INuvemFiscalTokenRepository');
const { logger } = require('../../../middlewares/logger');

class NuvemFiscalTokenRepository extends BaseRepository {
  constructor() {
    super('nuvem_fiscal_tokens', 'token_id');
  }

  /**
   * Obtém um token válido para o ambiente especificado
   * @param {string} ambiente - Ambiente do token (HOMOLOGACAO ou PRODUCAO)
   * @returns {Promise<Object|null>} Token válido ou null
   */
  async obterTokenValido(ambiente = 'HOMOLOGACAO') {
    try {
      const result = await this.pool.query(`
        SELECT token_id, access_token, expires_at 
        FROM nuvem_fiscal_tokens 
        WHERE environment = $1 
          AND expires_at > NOW() 
        ORDER BY expires_at DESC 
        LIMIT 1
      `, [ambiente]);

      if (result.rows.length > 0) {
        logger.info('Token válido encontrado', { 
          ambiente,
          expiresAt: result.rows[0].expires_at 
        });
        return result.rows[0];
      }

      return null;
    } catch (error) {
      logger.error('Erro ao buscar token válido', { 
        error: error.message,
        ambiente 
      });
      throw error;
    }
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
    try {
      const result = await this.create({
        access_token: tokenData.access_token,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)),
        environment: tokenData.environment || 'HOMOLOGACAO'
      });

      logger.info('Token da Nuvem Fiscal criado', { 
        tokenId: result.token_id,
        expiresAt: result.expires_at,
        ambiente: result.environment
      });

      return result;
    } catch (error) {
      logger.error('Erro ao criar token da Nuvem Fiscal', { 
        error: error.message,
        data: tokenData 
      });
      throw error;
    }
  }

  /**
   * Invalida um token específico
   * @param {number} tokenId - ID do token
   * @returns {Promise<void>}
   */
  async invalidarToken(tokenId) {
    try {
      await this.update(tokenId, { 
        expires_at: new Date() 
      });

      logger.info('Token da Nuvem Fiscal invalidado', { tokenId });
    } catch (error) {
      logger.error('Erro ao invalidar token', { 
        error: error.message,
        tokenId 
      });
      throw error;
    }
  }
}

module.exports = new NuvemFiscalTokenRepository();
