const axios = require('axios');
const logger = require('../../config/logger');

class AddressService {
  constructor() {
    this.apiUrl = 'https://viacep.com.br/ws';
  }

  async fetchAddressData(cep, requestId) {
    try {
      logger.info('=== INICIANDO CONSULTA DE CEP ===', { 
        requestId,
        cep,
        url: this.apiUrl 
      });

      // Remove caracteres não numéricos do CEP
      const cleanCep = cep.replace(/[^0-9]/g, '');
      
      if (cleanCep.length !== 8) {
        throw new Error('CEP inválido');
      }

      const url = `${this.apiUrl}/${cleanCep}/json`;
      logger.info('Preparando requisição para API ViaCEP', { 
        requestId,
        cep: cleanCep,
        url
      });

      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      logger.info('Resposta recebida da API ViaCEP', { 
        requestId,
        status: response.status,
        data: response.data
      });

      if (response.data.erro) {
        throw new Error('CEP não encontrado');
      }

      // Normaliza os dados para o formato do sistema
      const normalizedData = {
        cep: response.data.cep,
        logradouro: response.data.logradouro,
        complemento: response.data.complemento,
        bairro: response.data.bairro,
        cidade: response.data.localidade,
        estado: response.data.uf,
        ibge: response.data.ibge,
        ddd: response.data.ddd
      };

      return normalizedData;

    } catch (error) {
      logger.error('Erro ao consultar CEP', {
        requestId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = new AddressService();
