const BaseRepository = require('../../../repositories/base/BaseRepository');
const ITemporaryTokenRepository = require('../interfaces/ITemporaryTokenRepository');
const { logger } = require('../../../middlewares/logger');

class TemporaryTokenRepository extends BaseRepository {
  constructor() {
    super('temporary_tokens', 'id');
  }

  /**
   * Cria um novo token temporário
   * @param {Object} tokenData - Dados do token
   * @returns {Promise<Object>} Token criado
   */
  async create(tokenData) {
    try {
      // Tenta encontrar um token existente para a credencial
      const query = `
        SELECT *
        FROM ${this.tableName}
        WHERE credential_id = $1
        LIMIT 1
      `;
      const queryResult = await this.pool.query(query, [tokenData.credentialId]);
      const existingToken = queryResult.rows[0];

      if (existingToken) {
        // Se encontrou, atualiza o token
        const result = await super.update(
          existingToken.id,
          {
            token: tokenData.token,
            expires_in_seconds: tokenData.expiresInSeconds
          }
        );

        logger.info('Token temporário atualizado', { 
          tokenId: result.id,
          credentialId: result.credential_id
        });

        return result;
      }

      // Se não encontrou, cria um novo
      const result = await super.create({
        token: tokenData.token,
        credential_id: tokenData.credentialId,
        expires_in_seconds: tokenData.expiresInSeconds
      });

      logger.info('Token temporário criado', { 
        tokenId: result.id,
        credentialId: result.credential_id
      });

      return result;
    } catch (error) {
      logger.error('Erro ao criar token temporário', { 
        error: error.message,
        data: tokenData 
      });
      throw error;
    }
  }

  /**
   * Busca um token válido por credential_id
   * @param {number} credentialId - ID da credencial
   * @returns {Promise<Object|null>} Token válido ou null
   */
  async findValidTokenByCredentialId(credentialId) {
    try {
      const result = await this.pool.query(`
        SELECT id, token, generated_at, expires_at, credential_id, expires_in_seconds
        FROM temporary_tokens
        WHERE credential_id = $1 
          AND expires_at > NOW()
        ORDER BY generated_at DESC
        LIMIT 1
      `, [credentialId]);

      if (result.rows.length > 0) {
        logger.info('Token válido encontrado', { 
          credentialId,
          expiresAt: result.rows[0].expires_at 
        });
        return result.rows[0];
      }

      return null;
    } catch (error) {
      logger.error('Erro ao buscar token válido', { 
        error: error.message,
        credentialId 
      });
      throw error;
    }
  }

  /**
   * Remove tokens expirados
   * @returns {Promise<number>} Número de tokens removidos
   */
  async removeExpiredTokens() {
    try {
      const result = await this.pool.query(`
        DELETE FROM temporary_tokens
        WHERE expires_at <= NOW()
        RETURNING id
      `);

      const removedCount = result.rowCount;

      logger.info('Tokens expirados removidos', { 
        count: removedCount 
      });

      return removedCount;
    } catch (error) {
      logger.error('Erro ao remover tokens expirados', { 
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new TemporaryTokenRepository();
