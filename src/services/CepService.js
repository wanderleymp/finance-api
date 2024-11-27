const axios = require('axios');
const logger = require('../../config/logger');

class CepService {
  constructor() {
    this.viaCepBaseUrl = 'https://viacep.com.br/ws';
  }

  async validateAndGetAddress(cep) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      logger.info('=== CONSULTANDO CEP ===', {
        requestId,
        cep
      });

      // Remove non-numeric characters
      const cleanCep = cep.replace(/\D/g, '');
      
      // Validate CEP format
      if (cleanCep.length !== 8) {
        throw new Error('CEP inválido: deve conter 8 dígitos');
      }

      const response = await axios.get(`${this.viaCepBaseUrl}/${cleanCep}/json`);
      const address = response.data;

      // Check if CEP exists
      if (address.erro) {
        throw new Error('CEP não encontrado');
      }

      // Validate required fields
      const requiredFields = ['logradouro', 'bairro', 'localidade', 'uf'];
      const missingFields = requiredFields.filter(field => !address[field]);

      if (missingFields.length > 0) {
        logger.warn('CEP genérico detectado - campos obrigatórios ausentes:', {
          requestId,
          cep,
          missingFields
        });
        return {
          isValid: false,
          message: 'CEP genérico: não contém dados completos do endereço',
          address: null
        };
      }

      // Format the address data
      const formattedAddress = {
        street: address.logradouro,
        neighborhood: address.bairro,
        city: address.localidade,
        state: address.uf,
        postal_code: cleanCep,
        ibge: address.ibge ? parseInt(address.ibge) : null,
        country: 'Brasil'
      };

      logger.info('Consulta de CEP concluída com sucesso', {
        requestId,
        address: formattedAddress
      });

      return {
        isValid: true,
        address: formattedAddress
      };
    } catch (error) {
      logger.error('Erro ao consultar CEP:', {
        requestId,
        cep,
        error: error.message
      });

      throw error;
    }
  }
}

module.exports = CepService;
