"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validateRequest = void 0;
exports.validateLogin = validateLogin;
exports.validateRegistration = validateRegistration;
exports.validatePerson = validatePerson;
exports.validateContact = validateContact;
exports.validatePersonContact = validatePersonContact;
exports.globalErrorHandler = globalErrorHandler;
const zod_1 = require("zod");
const apiErrors_1 = require("../utils/apiErrors");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessages = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                throw new apiErrors_1.ApiError('Erro de validação', 400, errorMessages);
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
// Esquemas de validação comuns
exports.schemas = {
    login: zod_1.z.object({
        body: zod_1.z.object({
            user_name: zod_1.z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres').max(50, 'Nome de usuário deve ter no máximo 50 caracteres'),
            password: zod_1.z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres')
        })
    }),
    registration: zod_1.z.object({
        body: zod_1.z.object({
            user_name: zod_1.z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres').max(50, 'Nome de usuário deve ter no máximo 50 caracteres'),
            password: zod_1.z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres')
                .refine((password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password), 'Senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula e 1 número')
        })
    }),
    person: zod_1.z.object({
        body: zod_1.z.object({
            full_name: zod_1.z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
            fantasy_name: zod_1.z.string().optional(),
            isCompany: zod_1.z.boolean().optional()
        })
    }),
    contact: zod_1.z.object({
        body: zod_1.z.object({
            type: zod_1.z.enum(['PHONE', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'OTHER']),
            value: zod_1.z.string().min(3, 'Valor do contato inválido')
        })
    }),
    personContact: zod_1.z.object({
        body: zod_1.z.object({
            personId: zod_1.z.string().uuid('ID da pessoa inválido'),
            contactId: zod_1.z.string().uuid('ID do contato inválido'),
            description: zod_1.z.string().optional()
        })
    })
};
// Funções de validação específicas
function validateLogin(req, res, next) {
    return (0, exports.validateRequest)(exports.schemas.login)(req, res, next);
}
function validateRegistration(req, res, next) {
    return (0, exports.validateRequest)(exports.schemas.registration)(req, res, next);
}
function validatePerson(req, res, next) {
    return (0, exports.validateRequest)(exports.schemas.person)(req, res, next);
}
function validateContact(req, res, next) {
    return (0, exports.validateRequest)(exports.schemas.contact)(req, res, next);
}
function validatePersonContact(req, res, next) {
    return (0, exports.validateRequest)(exports.schemas.personContact)(req, res, next);
}
function globalErrorHandler(err, req, res, next) {
    if (err instanceof apiErrors_1.ApiError) {
        return res.status(err.statusCode).json({
            message: err.message,
            errors: err.details
        });
    }
    res.status(500).json({
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado'
    });
}
//# sourceMappingURL=validationMiddleware.js.map