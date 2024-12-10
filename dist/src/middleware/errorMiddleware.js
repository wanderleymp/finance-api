"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const apiErrors_1 = require("../utils/apiErrors");
const logger_1 = __importDefault(require("../config/logger"));
const errorMiddleware = (err, req, res, next) => {
    // Log do erro
    logger_1.default.error(`Erro: ${err.message}`, {
        method: req.method,
        path: req.path,
        body: req.body
    });
    // Verificar se é um ApiError
    if (err instanceof apiErrors_1.ApiError) {
        return res.status(err.statusCode).json({
            error: err.message,
            details: err.errorDetails,
            status: err.statusCode
        });
    }
    // Tratamento de erros não previstos
    return res.status(500).json({
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        status: 500
    });
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=errorMiddleware.js.map