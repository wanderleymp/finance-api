const axios = require('axios');
const logger = require('../../config/logger');

class CompanyService {
  constructor() {
    this.apiUrl = 'https://www.receitaws.com.br/v1/cnpj';
    this.apiKey = process.env.RECEITAWS_API_KEY;
  }

  // Método para testar a API diretamente
  async testAPI(cnpj) {
    try {
      const cleanCnpj = cnpj.replace(/[^0-9]/g, '');
      console.log('=== TESTE DIRETO DA API ===');
      console.log(`URL: ${this.apiUrl}/${cleanCnpj}`);
      
      const response = await axios.get(`${this.apiUrl}/${cleanCnpj}`, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('=== ERRO NO TESTE DA API ===');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', error.response.data);
      } else if (error.request) {
        console.error('Erro na requisição:', error.message);
        console.error('Config:', error.config);
      } else {
        console.error('Erro:', error.message);
      }
      throw error;
    }
  }

  async fetchCompanyData(cnpj, requestId) {
    try {
      logger.info('=== INICIANDO CONSULTA DE EMPRESA ===', { 
        requestId,
        cnpj,
        url: this.apiUrl 
      });

      // Remove caracteres não numéricos do CNPJ
      const cleanCnpj = cnpj.replace(/[^0-9]/g, '');
      
      logger.info('Preparando requisição para API', { 
        requestId,
        cnpj: cleanCnpj,
        url: `${this.apiUrl}/${cleanCnpj}`,
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      try {
        const response = await axios.get(`${this.apiUrl}/${cleanCnpj}`, {
          headers: {
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        logger.info('Resposta recebida da API', { 
          requestId,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: JSON.stringify(response.data)
        });

        if (!response.data || response.data.status === 'ERROR') {
          const errorMsg = response.data?.message || 'Resposta inválida da API';
          logger.error('API retornou erro ou resposta inválida', {
            requestId,
            status: response.data?.status,
            message: errorMsg,
            data: response.data
          });
          throw new Error(errorMsg);
        }

        // Validar dados essenciais
        const data = response.data;
        if (!data.nome || !data.cnpj) {
          logger.error('Dados essenciais ausentes na resposta', {
            requestId,
            data: JSON.stringify(data)
          });
          throw new Error('Resposta da API não contém dados essenciais');
        }

        logger.info('Dados brutos recebidos', {
          requestId,
          nome: data.nome,
          cnpj: data.cnpj,
          situacao: data.situacao,
          atividade_principal: JSON.stringify(data.atividade_principal),
          atividades_secundarias: data.atividades_secundarias?.length
        });

        const mappedResponse = {
          full_name: data.nome,
          fantasy_name: data.fantasia || data.nome,
          birth_date: data.abertura ? new Date(data.abertura.split('/').reverse().join('-')) : null,
          person_type_id: 2, // Pessoa Jurídica
          documents: [{
            document_type_id: 2, // CNPJ
            document_value: data.cnpj.replace(/[^0-9]/g, '')
          }],
          addresses: [{
            street: data.logradouro || '',
            number: data.numero || '',
            complement: data.complemento || '',
            neighborhood: data.bairro || '',
            city: data.municipio || '',
            state: data.uf || '',
            postal_code: data.cep ? data.cep.replace(/[^0-9]/g, '') : '',
            country: 'Brasil'
          }],
          atividade_principal: data.atividade_principal || [],
          atividades_secundarias: data.atividades_secundarias || [],
          qsa: data.qsa || [],
          social_capital: data.capital_social ? parseFloat(data.capital_social.replace(/[^0-9,]/g, '').replace(',', '.')) : null,
          email: data.email,
          telefone: data.telefone ? data.telefone.replace(/[^0-9]/g, '') : null,
          simples: data.simples === 'Sim',
          mei: data.mei === 'Sim'
        };

        logger.info('Dados mapeados com sucesso', { 
          requestId,
          full_name: mappedResponse.full_name,
          atividade_principal: mappedResponse.atividade_principal.length,
          atividades_secundarias: mappedResponse.atividades_secundarias.length,
          qsa: mappedResponse.qsa.length,
          social_capital: mappedResponse.social_capital,
          email: mappedResponse.email,
          telefone: mappedResponse.telefone,
          simples: mappedResponse.simples,
          mei: mappedResponse.mei,
          mapeamento: JSON.stringify(mappedResponse)
        });

        return mappedResponse;
      } catch (error) {
        // Captura erros específicos da chamada axios
        if (error.response) {
          logger.error('Erro na resposta da API:', {
            requestId,
            status: error.response.status,
            statusText: error.response.statusText,
            data: JSON.stringify(error.response.data),
            headers: error.response.headers,
            message: error.message
          });
        } else if (error.request) {
          logger.error('Erro na requisição (sem resposta):', {
            requestId,
            error: error.message,
            code: error.code,
            config: JSON.stringify(error.config)
          });
        }
        throw error; // Re-throw para ser capturado pelo catch externo
      }
    } catch (error) {
      const errorMessage = `Erro ao consultar dados da empresa: ${error.message}`;
      logger.error(errorMessage, {
        requestId,
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
      throw new Error(errorMessage);
    }
  }

  mapTaxRegime(porte, naturezaJuridica) {
    logger.info('Mapeando regime tributário', {
      porte,
      naturezaJuridica
    });

    // Mapeamento básico inicial - pode ser expandido conforme necessidade
    if (porte?.toUpperCase().includes('ME') || porte?.toUpperCase().includes('EPP')) {
      return {
        id: 1,
        name: 'SIMPLES NACIONAL'
      };
    }

    // Default para outros casos
    return {
      id: 2,
      name: 'LUCRO PRESUMIDO'
    };
  }
}

module.exports = new CompanyService();
