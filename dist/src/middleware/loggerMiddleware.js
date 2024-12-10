"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = loggerMiddleware;
const logger_1 = __importDefault(require("../config/logger"));
function loggerMiddleware(req, res, next) {
    const startTime = Date.now();
    const method = req.method;
    const path = req.path;
    // Log de requisição
    logger_1.default.info(`[${method}] ${path}`, {
        method,
        path,
        body: Object.keys(req.body).length ? req.body : undefined,
        query: Object.keys(req.query).length ? req.query : undefined,
        ip: req.ip
    });
    // Sobrescrever método end para log de resposta
    const originalEnd = res.end;
    res.end = function (chunk, encoding, cb) {
        const duration = Date.now() - startTime;
        logger_1.default.info(`[${method}] ${path} - ${res.statusCode}`, {
            method,
            path,
            statusCode: res.statusCode,
            duration
        });
        // Chamar o método original
        return originalEnd.call(this, chunk, encoding || 'utf8', cb);
    };
    next();
}
//# sourceMappingURL=loggerMiddleware.js.map