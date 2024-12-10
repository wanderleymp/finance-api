import app from './app';
import { connectRabbitMQ } from './config/rabbitmq';
import { startTaskConsumer } from './services/taskService';
import logger from './config/logger';

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log('🚨 DEBUG - INICIANDO SERVIDOR COM LOGS DETALHADOS');
    console.log(`🔧 DEBUG - Variáveis de ambiente:
      PORT: ${PORT}
      NODE_ENV: ${process.env.NODE_ENV || 'development'}
      JWT_SECRET: ${process.env.JWT_SECRET ? 'DEFINIDO' : 'NÃO DEFINIDO'}
    `);
    console.log('🚀 DEBUG - Iniciando servidor...');
    console.log(`🔧 DEBUG - Porta configurada: ${PORT}`);
    console.log(`🌐 DEBUG - Ambiente: ${process.env.NODE_ENV || 'development'}`);

    // Conectar ao RabbitMQ
    console.log('🐰 DEBUG - Conectando ao RabbitMQ...');
    await connectRabbitMQ();
    console.log('✅ DEBUG - Conexão com RabbitMQ estabelecida');
    
    // Iniciar consumidor de tarefas
    console.log('📋 DEBUG - Iniciando consumidor de tarefas...');
    await startTaskConsumer();
    console.log('✅ DEBUG - Consumidor de tarefas iniciado');

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🌍 DEBUG - Servidor rodando na porta ${PORT}`);
      console.log(`🔍 DEBUG - Informações do servidor:`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      });

      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

    // Adicionar handlers de eventos para o servidor
    server.on('listening', () => {
      console.log('🟢 DEBUG - Servidor está escutando');
    });

    server.on('connection', (socket) => {
      console.log('🔗 DEBUG - Nova conexão estabelecida');
    });

    server.on('close', () => {
      console.log('🔴 DEBUG - Servidor fechado');
    });

    server.on('error', (error) => {
      console.error('❌ DEBUG - Erro no servidor:', error);
      logger.error('Erro no servidor:', error);
    });
  } catch (error) {
    console.error('❌ DEBUG - Erro crítico ao iniciar servidor:', error);
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
})();
