const axios = require('axios');
const { logger } = require('../../middlewares/logger');
const CacheService = require('../../services/cacheService');

class CnpjService {
    constructor(cacheService = CacheService) {
        this.cacheService = cacheService;
        this.baseUrl = process.env.CNPJ_API_URL || 'https://brasilapi.com.br/api/cnpj/v1';
    }

    /**
     * Consulta informações de CNPJ
     * @param {string} cnpj - CNPJ para consulta
     * @returns {Promise<Object>} Informações do CNPJ
     */
    async consultCnpj(cnpj) {
        // Remove caracteres não numéricos
        const cleanCnpj = cnpj.replace(/[^\d]/g, '');

        try {
            // Verifica cache primeiro
            const cachedData = await this.cacheService.get(`cnpj:${cleanCnpj}`);
            if (cachedData) {
                return cachedData;
            }

            // Consulta API
            const response = await axios.get(`${this.baseUrl}/${cleanCnpj}`);
            
            // Formata dados
            const formattedData = this.formatCnpjData(response.data);

            // Salva no cache por 24 horas
            await this.cacheService.set(
                `cnpj:${cleanCnpj}`, 
                formattedData, 
                24 * 60 * 60
            );

            return formattedData;
        } catch (error) {
            logger.error('Erro na consulta de CNPJ', {
                cnpj: cleanCnpj,
                error: error.message
            });

            // Tratamento de erros específicos
            if (error.response && error.response.status === 404) {
                throw new Error('CNPJ não encontrado');
            }

            throw new Error('Falha na consulta de CNPJ');
        }
    }

    /**
     * Formata os dados do CNPJ
     * @param {Object} data - Dados brutos da API
     * @returns {Object} Dados formatados
     */
    formatCnpjData(data) {
        return {
            cnpj: data.cnpj,
            razaoSocial: data.razao_social,
            nomeFantasia: data.nome_fantasia,
            situacaoCadastral: data.situacao_cadastral,
            dataAbertura: data.data_inicio_atividade,
            naturezaJuridica: data.natureza_juridica,
            capitalSocial: data.capital_social,
            endereco: {
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                municipio: data.municipio,
                uf: data.uf,
                cep: data.cep
            },
            contato: {
                telefone: data.ddd_telefone_1,
                email: data.email
            }
        };
    }
}

module.exports = new CnpjService();
