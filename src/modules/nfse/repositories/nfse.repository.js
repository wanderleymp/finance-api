const BaseRepository = require('../../../repositories/base/BaseRepository');
const { logger } = require('../../../middlewares/logger');

class NFSeRepository extends BaseRepository {
  constructor() {
    super('nfse_invoices', 'nfse_id');
  }

  async createNFSe(nfseData, transaction = null) {
    try {
      const { itens, ...nfseMainData } = nfseData;
      
      const nfseResult = await this.create(nfseMainData, transaction);
      
      if (itens && itens.length > 0) {
        const itemsWithNfseId = itens.map(item => ({
          ...item,
          nfse_id: nfseResult.nfse_id
        }));
        
        await this.database.insert('nfse_items', itemsWithNfseId);
      }

      logger.info('NFSe criada com sucesso', { 
        nfseId: nfseResult.nfse_id 
      });

      return nfseResult;
    } catch (error) {
      logger.error('Erro ao criar NFSe', { 
        error: error.message,
        data: nfseData 
      });
      throw error;
    }
  }

  async findNFSeWithDetails(nfseId) {
    try {
      const nfse = await this.findById(nfseId);
      
      const items = await this.database.query(
        'SELECT * FROM nfse_items WHERE nfse_id = $1', 
        [nfseId]
      );

      const events = await this.database.query(
        'SELECT * FROM nfse_events WHERE nfse_id = $1 ORDER BY data_evento DESC', 
        [nfseId]
      );

      return {
        ...nfse,
        items: items.rows,
        events: events.rows
      };
    } catch (error) {
      logger.error('Erro ao buscar detalhes da NFSe', { 
        nfseId, 
        error: error.message 
      });
      throw error;
    }
  }

  async updateNFSeStatus(nfseId, status, additionalData = {}) {
    try {
      const updateResult = await this.update(nfseId, {
        status,
        ...additionalData,
        updated_at: new Date()
      });

      await this.database.insert('nfse_events', {
        nfse_id: nfseId,
        tipo_evento: 'ATUALIZACAO_STATUS',
        status,
        dados_evento: JSON.stringify(additionalData)
      });

      return updateResult;
    } catch (error) {
      logger.error('Erro ao atualizar status da NFSe', { 
        nfseId, 
        status, 
        error: error.message 
      });
      throw error;
    }
  }

  async cancelNFSe(nfseId, motivoCancelamento) {
    try {
      const cancelResult = await this.updateNFSeStatus(nfseId, 'CANCELADA', {
        motivo_cancelamento: motivoCancelamento
      });

      logger.info('NFSe cancelada', { nfseId });
      return cancelResult;
    } catch (error) {
      logger.error('Erro ao cancelar NFSe', { 
        nfseId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = NFSeRepository;
