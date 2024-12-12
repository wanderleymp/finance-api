const amqp = require('amqplib');
const { logger } = require('../middlewares/logger');
require('dotenv').config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;

async function createRabbitMQConnection() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    logger.info('✅ Conectado ao RabbitMQ', {
      url: RABBITMQ_URL.replace(/:[^:]*@/, ':****@') // Oculta a senha
    });

    // Tratamento de erros de conexão
    connection.on('error', (err) => {
      logger.error('Erro na conexão do RabbitMQ', {
        error: err.message
      });
    });

    return { connection, channel };
  } catch (error) {
    logger.error('❌ Erro ao conectar ao RabbitMQ', {
      error: error.message,
      url: RABBITMQ_URL.replace(/:[^:]*@/, ':****@') // Oculta a senha
    });
    throw error;
  }
}

async function checkRabbitMQHealth() {
  try {
    const { connection, channel } = await createRabbitMQConnection();
    
    // Verificação adicional: tentar criar uma fila temporária
    const queueName = 'health_check_queue';
    await channel.assertQueue(queueName, { durable: false });
    await channel.deleteQueue(queueName);
    
    await channel.close();
    await connection.close();
    
    return true;
  } catch (error) {
    logger.error('Falha na verificação de saúde do RabbitMQ', {
      error: error.message
    });
    return false;
  }
}

module.exports = { 
  createRabbitMQConnection,
  checkRabbitMQHealth
};
