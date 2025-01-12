const axios = require('axios');
const { logger } = require('../../../middlewares/logger');
const NFSeRepository = require('../repositories/nfse.repository');
const NFSeDTO = require('../dto/nfse.dto');
const nuvemFiscalTokenService = require('./nuvem-fiscal-token.service');
const temporaryTokenService = require('../../tokens/services/temporary-token.service');

class NFSeService {
  constructor(deps = {}) {
    this.nfseRepository = deps.nfseRepository || new NFSeRepository();
  }

  async createNFSe(nfseData) {
    try {
      logger.info('Criando NFSe', { 
        dadosRecebidos: nfseData 
      });

      // Validar dados
      const validatedData = NFSeDTO.validate(
        nfseData, 
        NFSeDTO.create()
      );

      logger.info('Dados validados', { 
        dadosValidados: validatedData 
      });

      // Emitir NFSe na Nuvem Fiscal
      const nfseEmitida = await this.emitirNFSeNuvemFiscal(validatedData);

      logger.info('NFSe emitida', { 
        nfseEmitida 
      });

      // Salvar no banco
      const nfseSalva = await this.nfseRepository.createNFSe({
        ...validatedData,
        ...nfseEmitida
      });

      logger.info('NFSe salva no banco', { 
        nfseSalva 
      });

      return nfseSalva;
    } catch (error) {
      logger.error('Erro ao criar NFSe', { 
        error: error.message, 
        dados: nfseData,
        stack: error.stack 
      });
      throw error;
    }
  }

  async emitirNFSeNuvemFiscal(dadosNFSe) {
    try {
      // Obter token de autenticação
      const token = await nuvemFiscalTokenService.obterToken();

      logger.info('Token obtido para emissão de NFSe', {
        tokenValido: !!token
      });

      // Configurar payload para Nuvem Fiscal
      const payload = this.mapearPayloadNFSe(dadosNFSe);

      logger.info('Payload para emissão de NFSe', { payload });

      // Enviar requisição para emissão de NFSe
      const response = await axios.post(
        'https://api.nuvemfiscal.com.br/nfse/emissao', 
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Resposta da Nuvem Fiscal', { 
        data: response.data 
      });

      return {
        numero_nfse: response.data.numero,
        codigo_verificacao: response.data.codigoVerificacao,
        link_nfse: response.data.linkNFSe,
        status: 'EMITIDA'
      };
    } catch (error) {
      logger.error('Erro ao emitir NFSe na Nuvem Fiscal', { 
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      throw error;
    }
  }

  mapearPayloadNFSe(dadosNFSe) {
    return {
      prestador: {
        cnpj: dadosNFSe.prestador_cnpj,
        razaoSocial: dadosNFSe.prestador_razao_social
      },
      tomador: {
        cnpj: dadosNFSe.tomador_cnpj,
        cpf: dadosNFSe.tomador_cpf,
        razaoSocial: dadosNFSe.tomador_razao_social
      },
      servicos: dadosNFSe.itens.map(item => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valor_unitario,
        valorTotal: item.valor_total
      })),
      valorTotal: dadosNFSe.valor_total
    };
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

  /**
   * Lista NFSe para um determinado CNPJ
   * @param {string} cnpjEmitente - CNPJ do emitente
   * @param {Object} [filtros={}] - Filtros opcionais para a busca
   * @returns {Promise<Object>} Resultado da busca de NFSe
   */
  async listarNfse(cnpjEmitente, filtros = {}) {
    try {
      // Obtém token válido
      const token = await temporaryTokenService.obterToken('Nuvem Fiscal');

      // Configurações padrão de filtro
      const params = {
        cpf_cnpj: cnpjEmitente,
        ambiente: 'producao',
        ...filtros
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      // Faz a requisição para a API da Nuvem Fiscal
      const response = await axios.get('https://api.nuvemfiscal.com.br/nfse', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: params
      });

      // Mapeia a resposta para o formato esperado
      return {
        total: response.data.data.length || 0,
        items: response.data.data || [],
        pages: 1
      };
    } catch (error) {
      logger.error('Erro ao listar NFSe', {
        error: error.message,
        cnpjEmitente,
        errorResponse: error.response?.data
      });
      throw error;
    }
  }

  async emitirNfseParaMovimento(movementId) {
    try {
      logger.info('Emitindo NFSe para movimento', { movementId });
      
      const emissaoNfseService = require('./emissao-nfse.service');
      const nfseEmissao = new emissaoNfseService();
      
      const nfse = await nfseEmissao.emitirNfseParaMovimento(movementId);
      
      logger.info('NFSe emitida para movimento', { 
        movementId, 
        nfse 
      });
      
      return nfse;
    } catch (error) {
      logger.error('Erro ao emitir NFSe para movimento', { 
        movementId,
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }
}

module.exports = NFSeService;
