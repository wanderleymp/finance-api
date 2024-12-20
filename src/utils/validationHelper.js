const { logger } = require('../middlewares/logger');

class ValidationError extends Error {
    constructor(message, errors = []) {
        super(message);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

class ValidationHelper {
    /**
     * Valida campos obrigatórios
     * @param {Object} data - Dados a serem validados
     * @param {string[]} requiredFields - Lista de campos obrigatórios
     * @throws {ValidationError} Se algum campo obrigatório estiver faltando
     */
    static validateRequired(data, requiredFields) {
        const missingFields = requiredFields.filter(field => {
            const value = data[field];
            return value === undefined || value === null || value === '';
        });

        if (missingFields.length > 0) {
            throw new ValidationError('Campos obrigatórios faltando', missingFields);
        }
    }

    /**
     * Valida se um valor está dentro de uma lista de valores permitidos
     * @param {any} value - Valor a ser validado
     * @param {any[]} allowedValues - Lista de valores permitidos
     * @param {string} fieldName - Nome do campo para mensagem de erro
     * @throws {ValidationError} Se o valor não estiver na lista
     */
    static validateEnum(value, allowedValues, fieldName) {
        if (!allowedValues.includes(value)) {
            throw new ValidationError(
                `Valor inválido para ${fieldName}`,
                [`${fieldName} deve ser um dos seguintes valores: ${allowedValues.join(', ')}`]
            );
        }
    }

    /**
     * Valida se um valor é um número válido
     * @param {any} value - Valor a ser validado
     * @param {Object} options - Opções de validação
     * @param {string} fieldName - Nome do campo para mensagem de erro
     * @throws {ValidationError} Se o valor não for um número válido
     */
    static validateNumber(value, options = {}, fieldName) {
        const { min, max, integer = false } = options;
        const errors = [];

        if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${fieldName} deve ser um número válido`);
        } else {
            if (min !== undefined && value < min) {
                errors.push(`${fieldName} deve ser maior ou igual a ${min}`);
            }
            if (max !== undefined && value > max) {
                errors.push(`${fieldName} deve ser menor ou igual a ${max}`);
            }
            if (integer && !Number.isInteger(value)) {
                errors.push(`${fieldName} deve ser um número inteiro`);
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(`Valor inválido para ${fieldName}`, errors);
        }
    }

    /**
     * Valida se uma data é válida
     * @param {string|Date} value - Data a ser validada
     * @param {Object} options - Opções de validação
     * @param {string} fieldName - Nome do campo para mensagem de erro
     * @throws {ValidationError} Se a data não for válida
     */
    static validateDate(value, options = {}, fieldName) {
        const { min, max, format = 'YYYY-MM-DD' } = options;
        const errors = [];

        const date = new Date(value);
        if (isNaN(date.getTime())) {
            errors.push(`${fieldName} deve ser uma data válida no formato ${format}`);
        } else {
            if (min && date < new Date(min)) {
                errors.push(`${fieldName} deve ser posterior a ${min}`);
            }
            if (max && date > new Date(max)) {
                errors.push(`${fieldName} deve ser anterior a ${max}`);
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(`Data inválida para ${fieldName}`, errors);
        }
    }

    /**
     * Valida um CPF/CNPJ
     * @param {string} value - CPF/CNPJ a ser validado
     * @param {string} fieldName - Nome do campo para mensagem de erro
     * @throws {ValidationError} Se o CPF/CNPJ não for válido
     */
    static validateDocument(value, fieldName) {
        const errors = [];
        const numbers = value.replace(/\D/g, '');

        if (numbers.length !== 11 && numbers.length !== 14) {
            errors.push(`${fieldName} deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)`);
        } else if (numbers.length === 11) {
            // Validação de CPF
            if (!/^\d{11}$/.test(numbers)) {
                errors.push(`${fieldName} deve conter apenas números`);
            } else if (/^(\d)\1{10}$/.test(numbers)) {
                errors.push(`${fieldName} não pode ter todos os dígitos iguais`);
            }
        } else {
            // Validação de CNPJ
            if (!/^\d{14}$/.test(numbers)) {
                errors.push(`${fieldName} deve conter apenas números`);
            } else if (/^(\d)\1{13}$/.test(numbers)) {
                errors.push(`${fieldName} não pode ter todos os dígitos iguais`);
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(`Documento inválido para ${fieldName}`, errors);
        }
    }

    /**
     * Valida um email
     * @param {string} value - Email a ser validado
     * @param {string} fieldName - Nome do campo para mensagem de erro
     * @throws {ValidationError} Se o email não for válido
     */
    static validateEmail(value, fieldName) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new ValidationError(
                `Email inválido para ${fieldName}`,
                [`${fieldName} deve ser um endereço de email válido`]
            );
        }
    }

    /**
     * Valida um objeto com regras específicas
     * @param {Object} data - Objeto a ser validado
     * @param {Object} rules - Regras de validação
     * @throws {ValidationError} Se alguma regra não for satisfeita
     */
    static validate(data, rules) {
        const errors = [];

        for (const [field, rule] of Object.entries(rules)) {
            try {
                const value = data[field];

                if (rule.required) {
                    this.validateRequired({ [field]: value }, [field]);
                }

                if (value !== undefined && value !== null) {
                    if (rule.type === 'number') {
                        this.validateNumber(value, rule.options, field);
                    } else if (rule.type === 'date') {
                        this.validateDate(value, rule.options, field);
                    } else if (rule.type === 'enum') {
                        this.validateEnum(value, rule.values, field);
                    } else if (rule.type === 'document') {
                        this.validateDocument(value, field);
                    } else if (rule.type === 'email') {
                        this.validateEmail(value, field);
                    }

                    if (rule.custom) {
                        rule.custom(value, data);
                    }
                }
            } catch (error) {
                if (error instanceof ValidationError) {
                    errors.push(...error.errors);
                } else {
                    errors.push(`Erro ao validar ${field}: ${error.message}`);
                }
            }
        }

        if (errors.length > 0) {
            throw new ValidationError('Erro de validação', errors);
        }
    }
}

module.exports = {
    ValidationError,
    ValidationHelper
};
