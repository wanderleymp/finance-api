const Joi = require('joi');
const PersonSchema = require('../schemas/person.schema');
const { ValidationError } = require('../../../utils/errors');
const { validateCPF, validateCNPJ } = require('../../../utils/documentValidator');

const listPersonsSchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    name: Joi.string().trim().optional(),
    document: Joi.string().trim().optional(),
    type: Joi.string().valid('individual', 'legal').optional(),
    is_active: Joi.boolean().optional()
});

const createPersonSchema = PersonSchema.create;
const updatePersonSchema = PersonSchema.update;

class PersonValidator {
    /**
     * Valida documento (CPF ou CNPJ)
     * @param {string} document - Documento a ser validado
     * @returns {boolean} - Retorna true se o documento for válido
     */
    static validateDocument(document) {
        if (!document) {
            throw new Error('Documento é obrigatório');
        }

        // Remove caracteres não numéricos
        const cleanDocument = document.replace(/[^\d]/g, '');

        // Valida CPF
        if (cleanDocument.length === 11) {
            if (!validateCPF(cleanDocument)) {
                throw new Error('CPF inválido');
            }
            return true;
        }

        // Valida CNPJ
        if (cleanDocument.length === 14) {
            if (!validateCNPJ(cleanDocument)) {
                throw new Error('CNPJ inválido');
            }
            return true;
        }

        throw new Error('Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)');
    }

    /**
     * Valida endereço de e-mail
     * @param {string} email - E-mail a ser validado
     * @returns {boolean} - Retorna true se o e-mail for válido
     */
    static validateEmail(email) {
        if (!email) {
            return true; // E-mail opcional
        }

        // Expressão regular para validação de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            throw new Error('E-mail inválido');
        }

        return true;
    }

    /**
     * Valida data de nascimento
     * @param {string|Date} birthDate - Data de nascimento
     * @returns {boolean} - Retorna true se a data for válida
     */
    static validateBirthDate(birthDate) {
        if (!birthDate) {
            return true; // Data de nascimento opcional
        }

        const parsedDate = new Date(birthDate);

        // Verifica se é uma data válida
        if (isNaN(parsedDate.getTime())) {
            throw new Error('Data de nascimento inválida');
        }

        // Verifica se a data não é futura
        if (parsedDate > new Date()) {
            throw new Error('Data de nascimento não pode ser futura');
        }

        return true;
    }

    static validateCreate(data) {
        const { error } = PersonSchema.validateCreate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateUpdate(data) {
        const { error } = PersonSchema.validateUpdate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }
}

module.exports = PersonValidator;
