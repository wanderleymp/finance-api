"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swaggerUi = __importStar(require("swagger-ui-express"));
const cors_1 = __importDefault(require("cors"));
const swagger_1 = __importDefault(require("./config/swagger"));
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const logRoutes_1 = __importDefault(require("./routes/logRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const loggerMiddleware_1 = require("./middleware/loggerMiddleware");
const logger_1 = __importDefault(require("./config/logger"));
const app = (0, express_1.default)();
// Configuração do CORS
const corsOptions = {
    origin: ['http://localhost:3000', 'http://162.55.160.99:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
// Middleware
app.use((0, cors_1.default)(corsOptions));
// Middleware para parsear JSON
app.use(express_1.default.json());
// Middleware de logs
app.use(loggerMiddleware_1.loggerMiddleware);
// Rotas
app.use(healthRoutes_1.default);
app.use('/auth', authRoutes_1.default);
app.use('/tasks', taskRoutes_1.default);
app.use('/users', userRoutes_1.default);
app.use('/logs', logRoutes_1.default);
// Rota de documentação Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swagger_1.default));
// Tratamento de erros global
app.use((err, req, res, next) => {
    logger_1.default.error('Erro não tratado:', err);
    res.status(500).json({
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});
exports.default = app;
