import amqp from 'amqplib';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export async function connectRabbitMQ() {
  try {
    // Usar variável de ambiente para URL de conexão
    const rabbitmqUrl = process.env.RABBITMQ_URL;
    
    if (!rabbitmqUrl) {
      throw new Error('RABBITMQ_URL não configurada');
    }

    // Estabelecer conexão
    connection = await amqp.connect(rabbitmqUrl);
    
    // Criar canal
    channel = await connection.createChannel();
    
    console.log('✅ Conexão com RabbitMQ estabelecida');
    
    // Adicionar listener para reconexão em caso de falha
    connection.on('close', () => {
      console.error('❌ Conexão com RabbitMQ perdida. Tentando reconectar...');
      setTimeout(connectRabbitMQ, 5000);
    });
    
    return { connection, channel };
  } catch (error) {
    console.error('❌ Erro ao conectar ao RabbitMQ:', error);
    // Tentar reconectar após 5 segundos em caso de erro
    setTimeout(connectRabbitMQ, 5000);
    throw error;
  }
}

export async function closeRabbitMQ() {
  if (channel) await channel.close();
  if (connection) await connection.close();
}

export async function assertQueue(queueName: string) {
  if (!channel) {
    throw new Error('Canal RabbitMQ não inicializado');
  }
  
  await channel.assertQueue(queueName, { durable: true });
}

export { connection, channel };
