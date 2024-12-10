"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = validateLogin;
exports.validateRegistration = validateRegistration;
exports.globalErrorHandler = globalErrorHandler;
const logger_1 = __importDefault(require("../config/logger"));
function validateLogin(req, res, next) {
    try {
        const { user_name, password } = req.body;
        // Validar nome de usuário
        if (!user_name) {
            logger_1.default.warn('Tentativa de login sem nome de usuário');
            return res.status(400).json({ message: 'Nome de usuário é obrigatório' });
        }
        // Validar senha
        if (!password) {
            logger_1.default.warn('Tentativa de login sem senha');
            return res.status(400).json({ message: 'Senha é obrigatória' });
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Erro na validação de login', error);
        res.status(500).json({
            message: 'Erro na validação de login',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Ocorreu um erro inesperado'
        });
    }
}
function validateRegistration(req, res, next) {
    try {
        const { user_name, password } = req.body;
        // Validar nome de usuário
        if (!user_name) {
            logger_1.default.warn('Tentativa de registro sem nome de usuário');
            return res.status(400).json({ message: 'Nome de usuário é obrigatório' });
        }
        // Validar comprimento do nome de usuário
        if (user_name.length < 3 || user_name.length > 50) {
            logger_1.default.warn(`Nome de usuário inválido: ${user_name}`);
            return res.status(400).json({ message: 'Nome de usuário deve ter entre 3 e 50 caracteres' });
        }
        // Validar senha
        if (!password) {
            logger_1.default.warn('Tentativa de registro sem senha');
            return res.status(400).json({ message: 'Senha é obrigatória' });
        }
        // Validar comprimento da senha
        if (password.length < 8 || password.length > 100) {
            logger_1.default.warn('Senha não atende aos requisitos de comprimento');
            return res.status(400).json({ message: 'Senha deve ter entre 8 e 100 caracteres' });
        }
        // Validar força de senha (exemplo: pelo menos 1 letra maiúscula, 1 minúscula, 1 número)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
        if (!passwordRegex.test(password)) {
            logger_1.default.warn('Senha não atende aos requisitos de complexidade');
            return res.status(400).json({
                message: 'Senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula e 1 número'
            });
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Erro na validação de registro', error);
        res.status(500).json({
            message: 'Erro na validação de registro',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Ocorreu um erro inesperado'
        });
    }
}
function globalErrorHandler(err, req, res, next) {
    logger_1.default.error('Erro não tratado:', {
        error: err,
        path: req.path,
        method: req.method
    });
    res.status(500).json({
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado'
    });
}
//# sourceMappingURL=validationMiddleware.js.map