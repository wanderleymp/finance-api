const axios = require('axios');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');

class CepService {
    constructor() {
        this.baseUrl = 'https://viacep.com.br/ws';
    }

    async findAddressByCep(cep) {
        try {
            // Remove caracteres não numéricos do CEP
            const cleanCep = cep.replace(/\D/g, '');

            // Valida o formato do CEP
            if (cleanCep.length !== 8) {
                throw new ValidationError('CEP inválido. O CEP deve conter 8 dígitos.', 400);
            }

            logger.info('Consultando CEP', { cep: cleanCep });

            const response = await axios.get(`${this.baseUrl}/${cleanCep}/json`);

            // Verifica se o CEP existe
            if (response.data.erro) {
                throw new ValidationError('CEP não encontrado.', 404);
            }

            // Mapeia os campos do ViaCEP para o formato da nossa API
            const address = {
                street: response.data.logradouro,
                complement: response.data.complemento,
                neighborhood: response.data.bairro,
                city: response.data.localidade,
                state: response.data.uf,
                postal_code: cleanCep,
                ibge: response.data.ibge
            };

            logger.info('CEP consultado com sucesso', { cep: cleanCep });

            return address;
        } catch (error) {
            // Se for um erro já tratado, apenas repassa
            if (error instanceof ValidationError) {
                throw error;
            }

            // Se for erro de conexão com a API
            if (error.code === 'ECONNREFUSED') {
                logger.error('Erro de conexão com o serviço de CEP', {
                    error: error.message,
                    cep
                });
                throw new ValidationError('Serviço de CEP indisponível. Tente novamente mais tarde.', 503);
            }

            // Para outros erros
            logger.error('Erro ao consultar CEP', {
                error: error.message,
                stack: error.stack,
                cep
            });
            throw new ValidationError('Erro ao consultar CEP. Tente novamente mais tarde.', 500);
        }
    }
}

module.exports = new CepService();
