const axios = require('axios');
const { logger } = require('../../../middlewares/logger');
const NFSeRepository = require('../repositories/nfse.repository');
const NFSeDTO = require('../dto/nfse.dto');

class NFSeService {
  constructor(deps = {}) {
    this.nfseRepository = deps.nfseRepository || new NFSeRepository();
  }

  async createNFSe(nfseData) {
    try {
      // Validar dados
      const validatedData = NFSeDTO.validate(
        nfseData, 
        NFSeDTO.create()
      );

      // Emitir NFSe na Nuvem Fiscal
      const nfseEmitida = await this.emitirNFSeNuvemFiscal(
        {}, 
        validatedData
      );

      // Salvar no banco
      return this.nfseRepository.createNFSe({
        ...validatedData,
        ...nfseEmitida
      });
    } catch (error) {
      logger.error('Erro ao criar NFSe', { 
        error: error.message, 
        dados: nfseData 
      });
      throw error;
    }
  }

  async emitirNFSeNuvemFiscal(credenciais, dadosNFSe) {
    try {
      // Configurações de mock para desenvolvimento
      const mockCredenciais = {
        client_id: process.env.NUVEM_FISCAL_CLIENT_ID || 'mock_client_id',
        client_secret: process.env.NUVEM_FISCAL_CLIENT_SECRET || 'mock_client_secret'
      };

      // Enviar requisição para emissão de NFSe
      const response = {
        data: {
          numero: 'MOCK_NUMERO_NFSE',
          codigoVerificacao: 'MOCK_CODIGO_VERIFICACAO',
          linkNFSe: 'https://mock.nuvemfiscal.com.br/nfse/mock'
        }
      };

      return {
        numero_nfse: response.data.numero,
        codigo_verificacao: response.data.codigoVerificacao,
        link_nfse: response.data.linkNFSe,
        status: 'EMITIDA'
      };
    } catch (error) {
      logger.error('Erro ao emitir NFSe na Nuvem Fiscal', { 
        error: error.message 
      });
      throw error;
    }
  }

  async findNFSe(nfseId) {
    return this.nfseRepository.findNFSeWithDetails(nfseId);
  }

  async listNFSes(page = 1, limit = 10, filters = {}) {
    return this.nfseRepository.findAll(page, limit, filters, {
      orderBy: 'created_at DESC'
    });
  }

  async updateNFSeStatus(nfseId, status, additionalData) {
    return this.nfseRepository.updateNFSeStatus(nfseId, status, additionalData);
  }

  async cancelNFSe(nfseId, motivoCancelamento) {
    return this.nfseRepository.cancelNFSe(nfseId, motivoCancelamento);
  }
}

module.exports = NFSeService;
