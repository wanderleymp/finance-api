"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const rabbitmq_1 = require("./config/rabbitmq");
const taskService_1 = require("./services/taskService");
const logger_1 = __importDefault(require("./config/logger"));
const PORT = process.env.PORT || 3000;
(async () => {
    try {
        // Conectar ao RabbitMQ
        await (0, rabbitmq_1.connectRabbitMQ)();
        // Iniciar consumidor de tarefas
        await (0, taskService_1.startTaskConsumer)();
        // Iniciar servidor
        app_1.default.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            logger_1.default.info(`Servidor rodando na porta ${PORT}`);
            logger_1.default.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        logger_1.default.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
})();
