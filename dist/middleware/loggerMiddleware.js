"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = loggerMiddleware;
const logger_1 = __importDefault(require("../config/logger"));
function loggerMiddleware(req, res, next) {
    const { method, path, body, query } = req;
    // Log de requisição
    logger_1.default.info(`[${method}] ${path}`, {
        method,
        path,
        body: Object.keys(body).length ? body : undefined,
        query: Object.keys(query).length ? query : undefined,
        ip: req.ip
    });
    // Capturar tempo de resposta
    const startTime = Date.now();
    // Sobrescrever método end para log de resposta
    const originalEnd = res.end;
    res.end = function (chunk) {
        const duration = Date.now() - startTime;
        logger_1.default.info(`[${method}] ${path} - ${res.statusCode}`, {
            method,
            path,
            status: res.statusCode,
            duration: `${duration}ms`
        });
        // Chamar o método original
        return originalEnd.call(this, chunk);
    };
    next();
}
