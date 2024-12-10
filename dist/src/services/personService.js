"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonService = exports.PersonType = void 0;
const personRepository_1 = require("../repositories/personRepository");
const CnpjService_1 = require("./CnpjService");
const apiErrors_1 = require("../utils/apiErrors");
// Enum para tipos de pessoa
var PersonType;
(function (PersonType) {
    PersonType[PersonType["FISICA"] = 1] = "FISICA";
    PersonType[PersonType["JURIDICA"] = 2] = "JURIDICA";
})(PersonType || (exports.PersonType = PersonType = {}));
class PersonService {
    personRepository;
    cnpjService;
    constructor() {
        this.personRepository = new personRepository_1.PersonRepository();
        this.cnpjService = new CnpjService_1.CnpjService();
    }
    async createPerson(data) {
        // Validações básicas
        if (!data.full_name) {
            throw new apiErrors_1.ApiError('Nome completo é obrigatório', 400);
        }
        // Verificar se é pessoa jurídica e validar CNPJ
        if (data.person_type_id === PersonType.JURIDICA) {
            // Extrair CNPJ dos dados ou de algum documento
            const cnpj = this.extractCnpj(data);
            if (!cnpj) {
                throw new apiErrors_1.ApiError('CNPJ é obrigatório para pessoa jurídica', 400);
            }
            // Validar formato do CNPJ
            if (!this.cnpjService.isValidCnpj(cnpj)) {
                throw new apiErrors_1.ApiError('CNPJ inválido', 400);
            }
            try {
                // Consultar dados da empresa na API
                const companyData = await this.cnpjService.getCompanyData(cnpj);
                // Enriquecer dados da pessoa com informações da API
                data = this.enrichPersonData(data, companyData);
            }
            catch (error) {
                // Tratar erros de consulta de CNPJ
                if (error instanceof apiErrors_1.ApiError) {
                    // Se for um erro conhecido, relançar
                    throw error;
                }
                else {
                    // Erro desconhecido na consulta de CNPJ
                    throw new apiErrors_1.ApiError('Erro ao validar CNPJ', 422);
                }
            }
        }
        // Verificar se já existe uma pessoa com o mesmo nome
        const existingPerson = await this.personRepository.findByName(data.full_name, { exact: true });
        if (existingPerson.length > 0) {
            throw new apiErrors_1.ApiError('Já existe uma pessoa com este nome', 409);
        }
        return this.personRepository.create(data);
    }
    async updatePerson(id, personData) {
        // Verificar se a pessoa existe
        const existingPerson = await this.getPersonById(id);
        // Se for pessoa jurídica, validar CNPJ
        if (personData.person_type_id === PersonType.JURIDICA ||
            existingPerson.person_type_id === PersonType.JURIDICA) {
            const cnpj = this.extractCnpj(personData) ||
                this.extractCnpj(existingPerson);
            if (!cnpj) {
                throw new apiErrors_1.ApiError('CNPJ é obrigatório para pessoa jurídica', 400);
            }
            // Validar formato do CNPJ
            if (!this.cnpjService.isValidCnpj(cnpj)) {
                throw new apiErrors_1.ApiError('CNPJ inválido', 400);
            }
            try {
                // Consultar dados da empresa na API
                const companyData = await this.cnpjService.getCompanyData(cnpj);
                // Enriquecer dados da pessoa com informações da API
                personData = this.enrichPersonData(personData, companyData);
            }
            catch (error) {
                // Tratar erros de consulta de CNPJ
                if (error instanceof apiErrors_1.ApiError) {
                    // Se for um erro conhecido, relançar
                    throw error;
                }
                else {
                    // Erro desconhecido na consulta de CNPJ
                    throw new apiErrors_1.ApiError('Erro ao validar CNPJ', 422);
                }
            }
        }
        // Remover campos que não podem ser atualizados
        delete personData.person_id;
        delete personData.created_at;
        return this.personRepository.update(id, personData);
    }
    async getPersonById(id) {
        const person = await this.personRepository.findById(id);
        if (!person) {
            throw new apiErrors_1.ApiError('Pessoa não encontrada', 404);
        }
        return person;
    }
    async listPersons(options = {}) {
        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const skip = (page - 1) * pageSize;
        const [persons, total] = await Promise.all([
            this.personRepository.findAll({
                skip,
                take: pageSize,
                order: { created_at: 'DESC' }
            }),
            this.personRepository.count()
        ]);
        return {
            persons,
            total,
            page,
            pageSize
        };
    }
    async deletePerson(id) {
        // Verificar se a pessoa existe antes de deletar
        await this.getPersonById(id);
        return this.personRepository.delete(id);
    }
    // Método para salvar ou atualizar pessoa por CNPJ
    async saveOrUpdateByCnpj(cnpj) {
        // Validar formato do CNPJ
        if (!this.cnpjService.isValidCnpj(cnpj)) {
            throw new apiErrors_1.ApiError('CNPJ inválido', 400);
        }
        try {
            // Consultar dados da empresa na API
            const companyData = await this.cnpjService.getCompanyData(cnpj);
            // Preparar dados da pessoa
            const personData = {
                full_name: companyData.razao_social,
                fantasy_name: companyData.nome_fantasia,
                person_type_id: PersonType.JURIDICA,
                social_capital: companyData.capital_social ?
                    parseFloat(companyData.capital_social) : undefined,
                birth_date: companyData.data_situacao_cadastral
                    ? new Date(companyData.data_situacao_cadastral)
                    : undefined
            };
            // Primeiro, tentar encontrar a pessoa pelo CNPJ
            const existingPerson = await this.personRepository.findByCnpj(cnpj);
            if (existingPerson) {
                // Se a pessoa existe, atualizar
                return this.updatePerson(existingPerson.person_id, personData);
            }
            else {
                // Se não existe, criar novo registro
                return this.createPerson(personData);
            }
        }
        catch (error) {
            // Tratar erros de consulta de CNPJ
            if (error instanceof apiErrors_1.ApiError) {
                // Se for um erro conhecido, relançar
                throw error;
            }
            else {
                // Erro desconhecido na consulta de CNPJ
                throw new apiErrors_1.ApiError('Erro ao consultar CNPJ', 422);
            }
        }
    }
    // Método auxiliar para extrair CNPJ dos dados
    extractCnpj(data) {
        // Lógica para extrair CNPJ pode variar dependendo do modelo de dados
        // Exemplo: buscar em um campo de documento ou diretamente nos dados
        return data.cnpj ||
            data.document ||
            data.documents?.find((doc) => doc.type === 'CNPJ')?.number ||
            null;
    }
    // Método para enriquecer dados da pessoa com informações da API
    enrichPersonData(personData, companyData) {
        return {
            ...personData,
            full_name: personData.full_name || companyData.razao_social,
            fantasy_name: personData.fantasy_name || companyData.nome_fantasia,
            social_capital: personData.social_capital ||
                (companyData.capital_social ? parseFloat(companyData.capital_social) : undefined)
            // Adicionar mais campos conforme necessário
        };
    }
}
exports.PersonService = PersonService;
//# sourceMappingURL=personService.js.map