"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const logger_1 = __importDefault(require("./config/logger"));
const swagger_1 = __importDefault(require("./config/swagger"));
// Importações de rotas
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const personRoutes_1 = __importDefault(require("./routes/personRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const logRoutes_1 = __importDefault(require("./routes/logRoutes"));
const app = (0, express_1.default)();
// Middleware de logging
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.path}`);
    next();
});
// Middleware padrão
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rotas públicas
app.use('/health', healthRoutes_1.default);
app.use('/auth', authRoutes_1.default);
app.use('/tasks', taskRoutes_1.default);
app.use('/logs', logRoutes_1.default);
// Middleware de autenticação
app.use(authMiddleware_1.authMiddleware);
// Rotas protegidas
app.use('/users', userRoutes_1.default);
app.use('/persons', personRoutes_1.default);
// Middleware de tratamento de erros
app.use(errorMiddleware_1.errorMiddleware);
// Documentação Swagger
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// Rota 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        status: 404
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map