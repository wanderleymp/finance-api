const { logger } = require('../../../middlewares/logger');
const { ValidationError } = require('../../../utils/errors');

class ContactValidator {
    static async validateCreate(data) {
        try {
            const errors = [];

            // Validações básicas
            if (!data.person_id) {
                errors.push('ID da pessoa é obrigatório');
            }

            if (!data.type) {
                errors.push('Tipo de contato é obrigatório');
            } else if (!['email', 'phone', 'whatsapp'].includes(data.type)) {
                errors.push('Tipo de contato inválido. Use: email, phone ou whatsapp');
            }

            if (!data.contact) {
                errors.push('Contato é obrigatório');
            } else {
                // Validações específicas por tipo
                switch (data.type) {
                    case 'email':
                        if (!this.isValidEmail(data.contact)) {
                            errors.push('Email inválido');
                        }
                        break;
                    case 'phone':
                    case 'whatsapp':
                        if (!this.isValidPhone(data.contact)) {
                            errors.push('Número de telefone inválido');
                        }
                        break;
                }
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        } catch (error) {
            logger.error('Erro ao validar criação de contato', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    static async validateUpdate(data) {
        try {
            const errors = [];

            // Validações condicionais
            if (data.type && !['email', 'phone', 'whatsapp'].includes(data.type)) {
                errors.push('Tipo de contato inválido. Use: email, phone ou whatsapp');
            }

            if (data.contact) {
                // Validações específicas por tipo
                switch (data.type) {
                    case 'email':
                        if (!this.isValidEmail(data.contact)) {
                            errors.push('Email inválido');
                        }
                        break;
                    case 'phone':
                    case 'whatsapp':
                        if (!this.isValidPhone(data.contact)) {
                            errors.push('Número de telefone inválido');
                        }
                        break;
                }
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        } catch (error) {
            logger.error('Erro ao validar atualização de contato', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidPhone(phone) {
        // Remove todos os caracteres não numéricos
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Verifica se tem entre 10 e 11 dígitos (com ou sem DDD)
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            return false;
        }

        // Se tiver 11 dígitos, o primeiro deve ser 9
        if (cleanPhone.length === 11 && cleanPhone[2] !== '9') {
            return false;
        }

        return true;
    }

    static async validateList(query) {
        try {
            const errors = [];
            const { page, limit, type, is_active } = query;

            // Validação de paginação
            if (page && (isNaN(page) || page < 1)) {
                errors.push('Página deve ser um número maior que 0');
            }

            if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
                errors.push('Limite deve ser um número entre 1 e 100');
            }

            // Validação de filtros
            if (type && !['email', 'phone', 'whatsapp'].includes(type)) {
                errors.push('Tipo de contato inválido. Use: email, phone ou whatsapp');
            }

            if (is_active !== undefined && typeof is_active !== 'boolean') {
                errors.push('Status de ativo deve ser um booleano');
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        } catch (error) {
            logger.error('Erro ao validar parâmetros de listagem', {
                error: error.message,
                query
            });
            throw error;
        }
    }
}

// Schemas para validação de requisições
const listContactsSchema = {
    type: 'object',
    properties: {
        page: { type: 'number', minimum: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100 },
        type: { type: 'string', enum: ['email', 'phone', 'whatsapp'] },
        is_active: { type: 'boolean' }
    },
    additionalProperties: false
};

const createContactSchema = {
    type: 'object',
    required: ['person_id', 'type', 'contact'],
    properties: {
        person_id: { type: 'number' },
        type: { type: 'string', enum: ['email', 'phone', 'whatsapp'] },
        contact: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        is_main: { type: 'boolean' },
        is_active: { type: 'boolean' }
    },
    additionalProperties: false
};

const updateContactSchema = {
    type: 'object',
    properties: {
        type: { type: 'string', enum: ['email', 'phone', 'whatsapp'] },
        contact: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        is_main: { type: 'boolean' },
        is_active: { type: 'boolean' }
    },
    additionalProperties: false
};

module.exports = {
    ContactValidator,
    listContactsSchema,
    createContactSchema,
    updateContactSchema
};
