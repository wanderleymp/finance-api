"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const rabbitmq_js_1 = require("./config/rabbitmq.js");
const taskService_js_1 = require("./services/taskService.js");
const logger_js_1 = __importDefault(require("./config/logger.js"));
const PORT = process.env.PORT || 3000;
(async () => {
    try {
        // Conectar ao RabbitMQ
        await (0, rabbitmq_js_1.connectRabbitMQ)();
        // Iniciar consumidor de tarefas
        await (0, taskService_js_1.startTaskConsumer)();
        // Iniciar servidor
        app_js_1.default.listen(PORT, () => {
            logger_js_1.default.info(`Servidor rodando na porta ${PORT}`);
            logger_js_1.default.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        logger_js_1.default.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
})();
