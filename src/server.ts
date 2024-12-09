import app from './app.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import { startTaskConsumer } from './services/taskService.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Conectar ao RabbitMQ
    await connectRabbitMQ();
    
    // Iniciar consumidor de tarefas
    await startTaskConsumer();

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
})();
