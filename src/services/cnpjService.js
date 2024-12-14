const axios = require('axios');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');

class CnpjService {
    constructor() {
        this.baseUrl = 'https://receitaws.com.br/v1/cnpj';
        this.cache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 horas em millisegundos
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 segundo
    }

    validateCnpjFormat(cnpj) {
        logger.info('CNPJ SERVICE: Iniciando validação de formato', { cnpj });

        const cleanCnpj = cnpj.replace(/[^\d]/g, '');
        
        if (cleanCnpj.length !== 14) {
            throw new ValidationError('CNPJ deve conter 14 dígitos', 400);
        }

        // Validação do CNPJ
        let size = cleanCnpj.length - 2;
        let numbers = cleanCnpj.substring(0, size);
        const digits = cleanCnpj.substring(size);
        let sum = 0;
        let pos = size - 7;

        // Validação do primeiro dígito
        for (let i = size; i >= 1; i--) {
            sum += numbers.charAt(size - i) * pos--;
            if (pos < 2) pos = 9;
        }

        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(0))) {
            throw new ValidationError('CNPJ inválido', 400);
        }

        // Validação do segundo dígito
        size = size + 1;
        numbers = cleanCnpj.substring(0, size);
        sum = 0;
        pos = size - 7;

        for (let i = size; i >= 1; i--) {
            sum += numbers.charAt(size - i) * pos--;
            if (pos < 2) pos = 9;
        }

        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(1))) {
            throw new ValidationError('CNPJ inválido', 400);
        }

        return cleanCnpj;
    }

    getCacheKey(cnpj) {
        return `cnpj:${cnpj}`;
    }

    getFromCache(cnpj) {
        const key = this.getCacheKey(cnpj);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            logger.info('CNPJ SERVICE: Retornando dados do cache', { cnpj });
            return cached.data;
        }
        
        return null;
    }

    setCache(cnpj, data) {
        const key = this.getCacheKey(cnpj);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    async makeRequest(cnpj, retryCount = 0) {
        try {
            logger.info('CNPJ SERVICE: Fazendo requisição para API', {
                url: `${this.baseUrl}/${cnpj}`,
                retryCount
            });

            const response = await axios.get(`${this.baseUrl}/${cnpj}`);
            
            logger.info('CNPJ SERVICE: Resposta da API recebida', {
                status: response.status,
                data: response.data
            });

            if (response.data.status === 'ERROR') {
                throw new ValidationError(response.data.message || 'CNPJ não encontrado', 404);
            }

            return response.data;
        } catch (error) {
            logger.error('CNPJ SERVICE: Erro na requisição', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status,
                code: error.code
            });

            if (retryCount < this.maxRetries && this.shouldRetry(error)) {
                logger.warn('CNPJ SERVICE: Tentando novamente após erro', {
                    cnpj,
                    retryCount,
                    error: error.message
                });

                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
                return this.makeRequest(cnpj, retryCount + 1);
            }

            throw this.handleApiError(error);
        }
    }

    shouldRetry(error) {
        const shouldRetry = (
            error.code === 'ECONNRESET' ||
            error.code === 'ECONNREFUSED' ||
            error.response?.status >= 500 ||
            error.response?.status === 429
        );

        logger.info('CNPJ SERVICE: Verificando se deve tentar novamente', {
            shouldRetry,
            errorCode: error.code,
            status: error.response?.status
        });

        return shouldRetry;
    }

    handleApiError(error) {
        logger.error('CNPJ SERVICE: Erro na consulta', {
            errorMessage: error.message,
            errorStatus: error.response?.status,
            errorData: error.response?.data,
            errorCode: error.code
        });

        if (error.code === 'ECONNREFUSED') {
            return new ValidationError('Não foi possível conectar ao serviço de CNPJ', 503);
        }

        if (error.response?.status === 404 || (error.response?.data && error.response.data.status === 'ERROR')) {
            return new ValidationError('CNPJ não encontrado', 404);
        }

        if (error.response?.status === 429) {
            return new ValidationError('Limite de requisições excedido. Tente novamente em alguns minutos.', 429);
        }

        return new ValidationError(`Erro ao consultar CNPJ: ${error.message}`, 500);
    }

    mapApiResponse(apiData) {
        return {
            cnpj: apiData.cnpj,
            razao_social: apiData.nome,
            nome_fantasia: apiData.fantasia || apiData.nome,
            situacao_cadastral: apiData.situacao,
            data_abertura: apiData.abertura,
            endereco: {
                logradouro: apiData.logradouro,
                numero: apiData.numero,
                complemento: apiData.complemento,
                bairro: apiData.bairro,
                cidade: apiData.municipio,
                estado: apiData.uf,
                cep: apiData.cep?.replace(/\D/g, '')
            },
            contato: {
                telefone: apiData.telefone,
                email: apiData.email
            },
            atividade_principal: apiData.atividade_principal?.[0]?.text,
            porte: apiData.porte,
            natureza_juridica: apiData.natureza_juridica,
            capital_social: apiData.capital_social,
            ultima_atualizacao: apiData.ultima_atualizacao,
            qsa: Array.isArray(apiData.qsa) ? apiData.qsa.map(socio => ({
                nome: socio.nome,
                qual: socio.qual,
                pais_origem: socio.pais_origem,
                nome_rep_legal: socio.nome_rep_legal,
                qual_rep_legal: socio.qual_rep_legal
            })) : []
        };
    }

    async findByCnpj(cnpj) {
        try {
            const cleanCnpj = this.validateCnpjFormat(cnpj);
            
            // Verifica cache
            const cachedData = this.getFromCache(cleanCnpj);
            if (cachedData) {
                return cachedData;
            }

            logger.info('CNPJ SERVICE: Iniciando consulta na API', { cnpj: cleanCnpj });
            
            const apiData = await this.makeRequest(cleanCnpj);
            const mappedData = this.mapApiResponse(apiData);
            
            // Salva no cache
            this.setCache(cleanCnpj, mappedData);
            
            return mappedData;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            logger.error('CNPJ SERVICE: Erro não tratado', {
                error: error.message,
                stack: error.stack
            });
            throw error; // Agora propagando o erro original
        }
    }
}

module.exports = new CnpjService();
