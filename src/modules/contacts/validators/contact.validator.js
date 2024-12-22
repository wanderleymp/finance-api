const Joi = require('joi');
const ContactSchema = require('../schemas/contact.schema');
const { ValidationError } = require('../../../utils/errors');

class ContactValidator {
    static validateCreate(data) {
        const { error } = ContactSchema.validateCreate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateUpdate(data) {
        const { error } = ContactSchema.validateUpdate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateContactType(type) {
        const validTypes = ['phone', 'email', 'whatsapp', 'telegram'];
        if (!validTypes.includes(type.toLowerCase())) {
            throw new ValidationError('Tipo de contato inválido');
        }
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ValidationError('E-mail inválido');
        }
    }

    static validatePhoneNumber(phone) {
        // Remove caracteres não numéricos
        const cleaned = phone.replace(/\D/g, '');
        
        // Verifica se tem 10 ou 11 dígitos
        if (![10, 11].includes(cleaned.length)) {
            throw new ValidationError('Número de telefone inválido');
        }
    }
}

const listContactsSchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    person_id: Joi.number().integer().positive().optional(),
    type: Joi.string().valid('phone', 'email', 'whatsapp', 'telegram').optional()
});

const createContactSchema = Joi.object({
    person_id: Joi.number().integer().positive().required(),
    type: Joi.string().valid('phone', 'email', 'whatsapp', 'telegram').required(),
    contact: Joi.string().trim().when('type', {
        is: 'phone',
        then: Joi.string().regex(/^\+?[1-9]\d{1,14}$/).required(),
        otherwise: Joi.alternatives().conditional('type', {
            is: 'email',
            then: Joi.string().email().required(),
            otherwise: Joi.string().trim().required()
        })
    }),
    description: Joi.string().trim().max(100).optional(),
    is_main: Joi.boolean().optional(),
    is_active: Joi.boolean().optional()
});

const updateContactSchema = Joi.object({
    person_id: Joi.number().integer().positive().optional(),
    type: Joi.string().valid('phone', 'email', 'whatsapp', 'telegram').optional(),
    contact: Joi.string().trim().when('type', {
        is: 'phone',
        then: Joi.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
        otherwise: Joi.alternatives().conditional('type', {
            is: 'email',
            then: Joi.string().email().optional(),
            otherwise: Joi.string().trim().optional()
        })
    }),
    description: Joi.string().trim().max(100).optional(),
    is_main: Joi.boolean().optional(),
    is_active: Joi.boolean().optional()
});

module.exports = {
    ContactValidator,
    listContactsSchema,
    createContactSchema,
    updateContactSchema
};
