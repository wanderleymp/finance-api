const axios = require('axios');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');

class CnpjService {
    constructor() {
        this.baseUrl = 'https://publica.cnpj.ws/cnpj';
        this.cache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 horas em millisegundos
    }

    async validateCnpj(cnpj) {
        const cleanCnpj = cnpj.replace(/[^\d]/g, '');
        
        if (cleanCnpj.length !== 14) {
            throw new ValidationError('CNPJ deve conter 14 dígitos', 400);
        }

        return cleanCnpj;
    }

    async findByCnpj(cnpj) {
        try {
            const cleanCnpj = await this.validateCnpj(cnpj);
            
            // Verifica cache
            const cachedData = this.cache.get(cleanCnpj);
            if (cachedData && (Date.now() - cachedData.timestamp) < this.cacheTimeout) {
                return cachedData.data;
            }

            const response = await axios.get(`${this.baseUrl}/${cleanCnpj}`);
            const rawData = response.data;

            // Mapeia os dados para o formato antigo esperado
            const mappedData = {
                nome: rawData.razao_social,
                razao_social: rawData.razao_social,
                fantasia: rawData.estabelecimento.nome_fantasia,
                cnpj: rawData.estabelecimento.cnpj,
                data_abertura: rawData.estabelecimento.data_inicio_atividade,
                email: rawData.estabelecimento.email,
                telefone: rawData.estabelecimento.telefone1 ? 
                    `${rawData.estabelecimento.ddd1}${rawData.estabelecimento.telefone1}` : null,
                status: rawData.estabelecimento.situacao_cadastral,
                situacao: rawData.estabelecimento.situacao_cadastral,
                ultima_atualizacao: rawData.estabelecimento.atualizado_em,
                tipo: rawData.estabelecimento.tipo,
                porte: rawData.porte.descricao,
                natureza_juridica: rawData.natureza_juridica.descricao,
                capital_social: rawData.capital_social,
                endereco: {
                    logradouro: rawData.estabelecimento.logradouro,
                    numero: rawData.estabelecimento.numero,
                    complemento: rawData.estabelecimento.complemento,
                    bairro: rawData.estabelecimento.bairro,
                    cidade: rawData.estabelecimento.cidade.nome,
                    estado: rawData.estabelecimento.estado.sigla,
                    cep: rawData.estabelecimento.cep,
                    ibge: rawData.estabelecimento.cidade.ibge_id
                },
                atividade_principal: rawData.estabelecimento.atividade_principal.descricao,
                atividades_secundarias: rawData.estabelecimento.atividades_secundarias.map(ativ => ativ.descricao),
                qsa: rawData.socios.map(socio => ({
                    nome: socio.nome,
                    qual: socio.qualificacao_socio.descricao
                }))
            };

            // Salva no cache
            this.cache.set(cleanCnpj, {
                data: mappedData,
                timestamp: Date.now()
            });

            return mappedData;
        } catch (error) {
            logger.error('Erro ao consultar CNPJ', { 
                cnpj,
                error: error.message,
                stack: error.stack
            });
            
            if (error.response?.status === 404) {
                throw new ValidationError('CNPJ não encontrado', 404);
            }
            
            if (error.response?.status === 429) {
                throw new ValidationError('Limite de requisições excedido', 429);
            }

            throw new ValidationError('Erro ao consultar CNPJ', 500);
        }
    }
}

module.exports = new CnpjService();
