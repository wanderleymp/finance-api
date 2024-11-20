const axios = require('axios');

const CNPJ_API_URL = process.env.CNPJ_API_URL || 'https://www.receitaws.com.br/v1/cnpj/';

class CNPJService {
  /**
   * Consulta informações do CNPJ usando a API externa.
   * @param {string} cnpj - O CNPJ a ser consultado.
   * @returns {Promise<object>} - Informações sobre o CNPJ.
   */
  static async fetchCNPJData(cnpj) {
    try {
      console.log(`[CNPJService] Iniciando consulta para o CNPJ: ${cnpj}`);
      const response = await axios.get(`${CNPJ_API_URL}${cnpj}`);
      console.log(`[CNPJService] Resposta da API:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[CNPJService] Erro ao consultar CNPJ: ${error.message}`);
      throw new Error('Erro ao consultar a API de CNPJ.');
    }
  }
}

module.exports = CNPJService;
