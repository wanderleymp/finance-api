"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CnpjService = void 0;
const axios_1 = __importDefault(require("axios"));
const apiErrors_1 = require("../utils/apiErrors");
class CnpjService {
    BASE_URL = 'https://minhareceita.org/';
    async getCompanyData(cnpj) {
        // Remover caracteres não numéricos do CNPJ
        const cleanedCnpj = cnpj.replace(/[^\d]/g, '');
        // Validar formato do CNPJ
        if (!/^\d{14}$/.test(cleanedCnpj)) {
            throw new apiErrors_1.ApiError('CNPJ inválido', 400);
        }
        try {
            const response = await axios_1.default.get(`${this.BASE_URL}`, {
                params: { cnpj: cleanedCnpj },
                timeout: 10000 // 10 segundos de timeout
            });
            // Verificar se a resposta contém dados
            if (!response.data || response.data.erro) {
                throw new apiErrors_1.ApiError('CNPJ não encontrado', 404);
            }
            // Mapear dados da resposta para o formato estruturado
            return this.mapCompanyData(response.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                // Tratamento de erros de rede ou API
                if (error.response) {
                    // A requisição foi feita e o servidor respondeu com um código de status
                    throw new apiErrors_1.ApiError(`Erro na consulta: ${error.response.status}`, 500);
                }
                else if (error.request) {
                    // A requisição foi feita, mas nenhuma resposta foi recebida
                    throw new apiErrors_1.ApiError('Sem resposta da API de CNPJ', 503);
                }
                else {
                    // Algo aconteceu ao configurar a requisição
                    throw new apiErrors_1.ApiError('Erro ao configurar consulta de CNPJ', 500);
                }
            }
            // Se for um erro genérico
            throw new apiErrors_1.ApiError('Erro desconhecido na consulta de CNPJ', 500);
        }
    }
    mapCompanyData(data) {
        return {
            cnpj: data.cnpj,
            nome_fantasia: data.nome_fantasia || '',
            razao_social: data.razao_social || '',
            situacao_cadastral: data.situacao_cadastral || '',
            data_situacao_cadastral: data.data_situacao_cadastral || '',
            porte: data.porte || '',
            natureza_juridica: data.natureza_juridica || '',
            capital_social: parseFloat(data.capital_social || '0'),
            atividade_principal: {
                code: data.atividade_principal?.code || '',
                text: data.atividade_principal?.text || ''
            },
            atividades_secundarias: data.atividades_secundarias?.map((atividade) => ({
                code: atividade.code || '',
                text: atividade.text || ''
            })) || [],
            logradouro: data.logradouro || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            cep: data.cep || '',
            bairro: data.bairro || '',
            municipio: data.municipio || '',
            uf: data.uf || '',
            email: data.email || undefined,
            telefone: data.telefone || undefined
        };
    }
    // Método para validar CNPJ
    isValidCnpj(cnpj) {
        // Remove caracteres não numéricos
        const cleanedCnpj = cnpj.replace(/[^\d]/g, '');
        // Verifica se tem 14 dígitos
        if (cleanedCnpj.length !== 14)
            return false;
        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1*$/.test(cleanedCnpj))
            return false;
        // Cálculo dos dígitos verificadores
        let sum = 0;
        let weight = 2;
        // Primeiro dígito verificador
        for (let i = 11; i >= 0; i--) {
            sum += parseInt(cleanedCnpj.charAt(i)) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        const digit1 = 11 - (sum % 11);
        const checkDigit1 = digit1 > 9 ? 0 : digit1;
        // Segundo dígito verificador
        sum = 0;
        weight = 2;
        for (let i = 12; i >= 0; i--) {
            sum += parseInt(cleanedCnpj.charAt(i)) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        const digit2 = 11 - (sum % 11);
        const checkDigit2 = digit2 > 9 ? 0 : digit2;
        // Compara os dígitos verificadores
        return (parseInt(cleanedCnpj.charAt(12)) === checkDigit1 &&
            parseInt(cleanedCnpj.charAt(13)) === checkDigit2);
    }
}
exports.CnpjService = CnpjService;
//# sourceMappingURL=CnpjService.js.map