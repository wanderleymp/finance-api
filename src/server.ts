import app from './app';
import { ENV } from './config/env';
import logger from './config/logger';
import { connectRabbitMQ } from './config/rabbitmq';
import { startTaskConsumer } from './services/taskService';
const PORT = parseInt(ENV.PORT, 10);
(async () => {
    try {
        // Conectar ao RabbitMQ
        await connectRabbitMQ();
        // Iniciar consumidor de tarefas
        await startTaskConsumer();
        // Iniciar servidor
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Servidor rodando na porta ${PORT}`);
        });
        // Tratamento de sinal de encerramento
        process.on("SIGTERM", () => {
            logger.info("\uD83D\uDD34 Recebendo sinal de encerramento");
            server.close(() => {
                logger.info("\uD83D\uDD34 Servidor fechado");
                process.exit(0);
            });
        });
        // Tratamento de erros do servidor
        server.on("error", (error: any) => {
            if (error.code === "EADDRINUSE") {
                logger.error(`Porta ${PORT} já está em uso`);
                process.exit(1);
            }
            else {
                logger.error("Erro no servidor:", error);
                process.exit(1);
            }
        });
        // Tratamento de erros não capturados
        process.on("uncaughtException", (error) => {
            logger.error("Exce\u00E7\u00E3o n\u00E3o capturada:", error);
            process.exit(1);
        });
        process.on("unhandledRejection", (reason, promise) => {
            logger.error("Rejei\u00E7\u00E3o de promessa n\u00E3o tratada:", reason);
            process.exit(1);
        });
    }
    catch (error) {
        logger.error("\u274C Erro cr\u00EDtico ao iniciar servidor:", error);
        process.exit(1);
    }
})();
