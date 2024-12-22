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
        logger.info('CNPJ SERVICE: CNPJ limpo', { cleanCnpj });
        
        if (cleanCnpj.length !== 14) {
            throw new ValidationError('CNPJ deve conter 14 dígitos', 400);
        }

        // Validação do CNPJ
        let size = cleanCnpj.length - 2;
        let numbers = cleanCnpj.substring(0, size);
        const digits = cleanCnpj.substring(size);
        let sum = 0;
        let pos = size - 7;

        logger.info('CNPJ SERVICE: Dados para validação', { 
            size,
            numbers,
            digits,
            pos
        });

        // Validação do primeiro dígito
        for (let i = size; i >= 1; i--) {
            const digit = numbers.charAt(size - i);
            const multiplier = pos--;
            sum += digit * multiplier;
            if (pos < 2) pos = 9;

            logger.info('CNPJ SERVICE: Validação primeiro dígito', {
                i,
                digit,
                multiplier,
                sum,
                pos
            });
        }

        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        logger.info('CNPJ SERVICE: Resultado primeiro dígito', {
            sum,
            result,
            expectedDigit: parseInt(digits.charAt(0))
        });

        if (result !== parseInt(digits.charAt(0))) {
            throw new ValidationError('CNPJ inválido', 400);
        }

        // Validação do segundo dígito
        size = size + 1;
        numbers = cleanCnpj.substring(0, size);
        sum = 0;
        pos = size - 7;

        logger.info('CNPJ SERVICE: Dados para validação do segundo dígito', {
            size,
            numbers,
            digits,
            pos
        });

        for (let i = size; i >= 1; i--) {
            const digit = numbers.charAt(size - i);
            const multiplier = pos--;
            sum += digit * multiplier;
            if (pos < 2) pos = 9;

            logger.info('CNPJ SERVICE: Validação segundo dígito', {
                i,
                digit,
                multiplier,
                sum,
                pos
            });
        }

        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        logger.info('CNPJ SERVICE: Resultado segundo dígito', {
            sum,
            result,
            expectedDigit: parseInt(digits.charAt(1))
        });

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

    mapApiResponse(data) {
        return {
            // Campos principais
            nome: data?.nome || '',
            razao_social: data?.nome || '',
            fantasia: data?.fantasia || '',
            
            // Contato
            contato: {
                email: data?.email || '',
                telefone: data?.telefone || ''
            },
            
            // Endereço
            endereco: {
                logradouro: data?.logradouro || '',
                numero: data?.numero || '',
                complemento: data?.complemento || '',
                bairro: data?.bairro || '',
                cidade: data?.municipio || '',
                estado: data?.uf || '',
                cep: data?.cep ? data.cep.replace(/[.-]/g, '') : ''
            },
            
            // Informações adicionais
            cnpj: data?.cnpj ? data.cnpj.replace(/[.-/]/g, '') : '',
            situacao_cadastral: data?.situacao || '',
            natureza_juridica: data?.natureza_juridica || '',
            porte: data?.porte || '',
            capital_social: data?.capital_social || 0,
            data_abertura: data?.abertura ? this.parseDate(data.abertura) : null,
            
            // Detalhes extras
            atividade_principal: data?.atividade_principal?.[0]?.text || '',
            ultima_atualizacao: data?.ultima_atualizacao ? new Date(data.ultima_atualizacao) : null,
            
            // Informações societárias
            qsa: Array.isArray(data?.qsa) ? data.qsa.map(socio => ({
                nome: socio?.nome || '',
                cargo: socio?.qual || ''
            })) : []
        };
    }

    parseDate(dateString) {
        try {
            // Converte de DD/MM/YYYY para Date
            const [day, month, year] = dateString.split('/');
            return new Date(`${year}-${month}-${day}`);
        } catch (error) {
            logger.warn('Erro ao converter data', { 
                dateString, 
                errorMessage: error.message 
            });
            return null;
        }
    }

    async findByCnpj(cnpj) {
        try {
            // Valida o formato do CNPJ
            const cleanCnpj = this.validateCnpjFormat(cnpj);
            logger.info('CNPJ SERVICE: CNPJ validado', { cleanCnpj });

            // Verifica cache
            const cachedData = this.getFromCache(cleanCnpj);
            if (cachedData) {
                logger.info('CNPJ SERVICE: Dados encontrados no cache', { cleanCnpj });
                return cachedData;
            }

            // Busca dados externos
            const response = await this.makeRequest(cleanCnpj);
            logger.info('CNPJ SERVICE: Dados externos obtidos', { 
                cleanCnpj, 
                razao_social: response.nome,
                nome_fantasia: response.fantasia
            });

            // Mapeia e salva no cache
            const companyData = this.mapApiResponse(response);
            this.setCache(cleanCnpj, companyData);

            return companyData;
        } catch (error) {
            logger.error('CNPJ SERVICE: Erro ao buscar dados', { 
                cnpj, 
                errorMessage: error.message,
                errorStack: error.stack 
            });
            throw error;
        }
    }
}

module.exports = new CnpjService();
