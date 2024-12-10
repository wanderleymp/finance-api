"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = __importDefault(require("./config/logger"));
const rabbitmq_1 = require("./config/rabbitmq");
const taskService_1 = require("./services/taskService");
const PORT = parseInt(env_1.ENV.PORT, 10);
(async () => {
    try {
        // Conectar ao RabbitMQ
        await (0, rabbitmq_1.connectRabbitMQ)();
        // Iniciar consumidor de tarefas
        await (0, taskService_1.startTaskConsumer)();
        // Iniciar servidor
        const server = app_1.default.listen(PORT, () => {
            logger_1.default.info(`🚀 Servidor rodando na porta ${PORT}`);
        });
        // Tratamento de sinal de encerramento
        process.on("SIGTERM", () => {
            logger_1.default.info("\uD83D\uDD34 Recebendo sinal de encerramento");
            server.close(() => {
                logger_1.default.info("\uD83D\uDD34 Servidor fechado");
                process.exit(0);
            });
        });
        // Tratamento de erros do servidor
        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                logger_1.default.error(`Porta ${PORT} já está em uso`);
                process.exit(1);
            }
            else {
                logger_1.default.error("Erro no servidor:", error);
                process.exit(1);
            }
        });
        // Tratamento de erros não capturados
        process.on("uncaughtException", (error) => {
            logger_1.default.error("Exce\u00E7\u00E3o n\u00E3o capturada:", error);
            process.exit(1);
        });
        process.on("unhandledRejection", (reason, promise) => {
            logger_1.default.error("Rejei\u00E7\u00E3o de promessa n\u00E3o tratada:", reason);
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.default.error("\u274C Erro cr\u00EDtico ao iniciar servidor:", error);
        process.exit(1);
    }
})();
//# sourceMappingURL=server.js.map