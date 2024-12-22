const axios = require('axios');
const { ValidationError } = require('../../utils/errors');
const { logger } = require('../../middlewares/logger');

class CepService {
    constructor() {
        this.axios = axios;
        this.baseUrl = 'https://viacep.com.br/ws';
        this.cache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 horas em millisegundos
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 segundo
    }

    validateCepFormat(cep) {
        logger.info('CEP SERVICE: Iniciando validação de formato', { cep });

        const cleanCep = cep.replace(/[^\d]/g, '');
        
        if (cleanCep.length !== 8) {
            const error = new ValidationError('CEP deve conter 8 dígitos', 400);
            error.statusCode = 400;
            throw error;
        }

        return cleanCep;
    }

    getCacheKey(cep) {
        return `cep:${cep}`;
    }

    getFromCache(cep) {
        const key = this.getCacheKey(cep);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            logger.info('CEP SERVICE: Retornando dados do cache', { cep });
            return cached.data;
        }
        
        return null;
    }

    setCache(cep, data) {
        const key = this.getCacheKey(cep);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    formatAddress(data) {
        return {
            street: data.logradouro,
            complement: data.complemento,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            postal_code: data.cep,
            ibge: data.ibge
        };
    }

    async makeRequest(cep, retryCount = 0) {
        try {
            logger.info('CEP SERVICE: Fazendo requisição para API', { 
                url: `https://viacep.com.br/ws/${cep}/json`, 
                retryCount 
            });

            const response = await this.axios.get(`https://viacep.com.br/ws/${cep}/json`);
            
            logger.info('CEP SERVICE: Resposta da API recebida', { 
                status: response.status, 
                data: response.data 
            });

            // Verifica se o CEP não foi encontrado
            if (response.data.erro === 'true') {
                const error = new ValidationError('CEP não encontrado', 404);
                error.statusCode = 404;
                throw error;
            }

            return this.formatAddress(response.data);
        } catch (error) {
            logger.error('CEP SERVICE: Erro na requisição', { 
                error: error.message, 
                cep 
            });

            // Se for um erro de CEP não encontrado, lança com status 404
            if (error.statusCode === 404) {
                throw error;
            }

            // Lógica de retry
            if (retryCount < 3) {
                logger.info('CEP SERVICE: Tentando novamente', { 
                    cep, 
                    retryCount: retryCount + 1, 
                    error: error.message 
                });
                return this.makeRequest(cep, retryCount + 1);
            }

            // Se todas as tentativas falharem
            const finalError = new ValidationError(
                'Erro ao consultar CEP. Tente novamente mais tarde.', 
                500
            );
            finalError.statusCode = 500;
            throw finalError;
        }
    }

    async findAddressByCep(cep) {
        try {
            const cleanCep = this.validateCepFormat(cep);
            
            // Verifica cache primeiro
            const cachedAddress = this.getFromCache(cleanCep);
            if (cachedAddress) {
                return cachedAddress;
            }

            // Faz requisição
            const apiResponse = await this.makeRequest(cleanCep);

            // Salva no cache
            this.setCache(cleanCep, apiResponse);

            logger.info('CEP SERVICE: Endereço encontrado com sucesso', { cep: cleanCep });

            return apiResponse;
        } catch (error) {
            logger.error('CEP SERVICE: Erro ao buscar endereço', {
                error: error.message,
                cep
            });
            throw error;
        }
    }
}

module.exports = new CepService();
