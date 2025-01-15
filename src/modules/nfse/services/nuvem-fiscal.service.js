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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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
   * @param {string} cnpj - CNPJ para consulta
   * @param {Object} [filtros={}] - Filtros de consulta
   * @param {string} [ambiente='PRODUCAO'] - Ambiente de consulta
   * @returns {Promise<Object>} Resultado da consulta
   */
  async consultarNfse(cnpj, filtros = {}, ambiente = 'PRODUCAO') {
    try {
      // Obtém token válido
      const token = await this.tokenService.obterToken(ambiente);

      // Configura headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Configura parâmetros de consulta
      const params = new URLSearchParams({
        cnpj,
        ...filtros
      });

      // Faz requisição de consulta
      const response = await axios.get(`${this.baseUrl}/nfse?${params}`, { headers });

      return response.data;
    } catch (error) {
      logger.error('Erro ao consultar NFSe na Nuvem Fiscal', {
        errorMessage: error.message,
        cnpj,
        filtros
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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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
}

module.exports = (tokenService) => new NuvemFiscalService(tokenService);
