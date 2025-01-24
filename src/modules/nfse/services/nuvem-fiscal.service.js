const axios = require('axios');
const { logger } = require('../../../middlewares/logger');

class NuvemFiscalService {
  constructor(tokenService) {
    this.tokenService = tokenService;
    this.baseUrl = process.env.NUVEM_FISCAL_URL || 'https://api.nuvemfiscal.com.br/nfse';
  }

  /**
   * Emite uma NFSe através da API da Nuvem Fiscal
   * @param {Object} payload - Payload para emissão de NFSe
   * @param {string} [ambiente='PRODUCAO'] - Ambiente de emissão
   * @returns {Promise<Object>} Resposta da API de Nuvem Fiscal
   */
  async emitirNfse(payload, ambiente = 'PRODUCAO') {
    try {
      // Obtém token válido
      const token = await this.tokenService.obterToken(ambiente);

      // Configura headers
      const headers = {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      logger.info('Enviando payload para Nuvem Fiscal', { 
        payload: JSON.stringify(payload),
        ambiente 
      });

      // Faz requisição
      try {
        const response = await axios.post(`${this.baseUrl}/dps`, payload, { headers });

        logger.info('Resposta da Nuvem Fiscal', { 
          status: response.status,
          data: JSON.stringify(response.data) 
        });

        return response.data;
      } catch (axiosError) {
        // Log detalhado do erro 400
        if (axiosError.response) {
          logger.error('Erro detalhado da Nuvem Fiscal', {
            status: axiosError.response.status,
            data: JSON.stringify(axiosError.response.data),
            headers: axiosError.response.headers
          });
        }

        throw axiosError;
      }
    } catch (error) {
      // Tratamento de erro centralizado
      logger.error('Erro ao emitir NFSe na Nuvem Fiscal', {
        errorMessage: error.message,
        errorStack: error.stack,
        payload: JSON.stringify(payload)
      });

      // Verifica se é um erro de autenticação
      if (error.response && error.response.status === 401) {
        throw new Error('Token de autenticação inválido ou expirado');
      }

      throw error;
    }
  }

  /**
   * Consulta NFSe na Nuvem Fiscal
   * @param {string} integrationNfseId - ID da NFSe na Nuvem Fiscal
   * @returns {Promise<Object>} Resultado da consulta
   */
  async consultarNfse(integrationNfseId) {
    try {
      const token = await this.tokenService.obterToken('producao');
      const response = await axios.get(`${this.baseUrl}/${integrationNfseId}`, { 
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      logger.info('Resposta da consulta NFSe na Nuvem Fiscal', {
        integrationNfseId,
        status: response.status,
        data: response.data
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('NFSe não encontrada na Nuvem Fiscal');
      }
      throw new Error('Erro ao consultar NFSe na Nuvem Fiscal');
    }
  }

  /**
   * Consulta status da NFSe na Nuvem Fiscal
   * @param {string} nfseId - ID da NFSe na Nuvem Fiscal
   * @param {string} [ambiente='PRODUCAO'] - Ambiente de consulta
   * @returns {Promise<Object>} Resultado da consulta
   */
  async consultarStatusNfse(nfseId, ambiente = 'PRODUCAO') {
    try {
      // Obtém token válido
      const token = await this.tokenService.obterToken(ambiente);

      // Configura headers
      const headers = {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Faz requisição de consulta
      const response = await axios.get(`https://api.nuvemfiscal.com.br/nfse/${nfseId}`, { headers });

      return response.data;
    } catch (error) {
      logger.error('Erro ao consultar NFSe na Nuvem Fiscal', {
        errorMessage: error.message,
        nfseId
      });
      throw error;
    }
  }

  /**
   * Cancela uma NFSe na Nuvem Fiscal
   * @param {string} chaveNfse - Chave de identificação da NFSe
   * @param {string} [ambiente='PRODUCAO'] - Ambiente de cancelamento
   * @returns {Promise<Object>} Resultado do cancelamento
   */
  async cancelarNfse(chaveNfse, ambiente = 'PRODUCAO') {
    try {
      // Obtém token válido
      const token = await this.tokenService.obterToken(ambiente);

      // Configura headers
      const headers = {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Faz requisição de cancelamento
      const response = await axios.delete(`${this.baseUrl}/nfse/${chaveNfse}`, { headers });

      return response.data;
    } catch (error) {
      logger.error('Erro ao cancelar NFSe na Nuvem Fiscal', {
        errorMessage: error.message,
        chaveNfse
      });
      throw error;
    }
  }

  /**
   * Baixa o PDF de uma NFSe
   * @param {string} integrationNfseId - ID de integração da NFSe
   * @param {Object} [options={}] - Opções adicionais
   * @returns {Promise<Buffer>} Buffer do PDF
   */
  async downloadNfsePdf(integrationNfseId, options = {}) {
    try {
      // Obtém token válido
      const ambiente = options.ambiente || 'PRODUCAO';
      const token = await this.tokenService.obterToken(ambiente);

      // Configura headers
      const headers = {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      logger.info('Baixando PDF da NFSe', { 
        integrationNfseId,
        ambiente 
      });

      // Faz requisição para baixar PDF
      const response = await axios.get(
        `${this.baseUrl}/${integrationNfseId}/pdf`, 
        { 
          headers, 
          responseType: 'arraybuffer' 
        }
      );

      logger.info('PDF da NFSe baixado com sucesso', { 
        integrationNfseId,
        tamanho: response.data.length 
      });

      return response.data;
    } catch (error) {
      logger.error('Erro ao baixar PDF da NFSe', { 
        integrationNfseId,
        error: error.message,
        stack: error.stack
      });

      // Tratamento de erros específicos
      if (error.response) {
        logger.error('Detalhes do erro da Nuvem Fiscal', {
          status: error.response.status,
          data: error.response.data.toString()
        });
      }

      throw error;
    }
  }
}

module.exports = (tokenService) => new NuvemFiscalService(tokenService);
