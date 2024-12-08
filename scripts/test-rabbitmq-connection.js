require('dotenv').config();
const amqp = require('amqplib');

async function testConnection() {
    const connectionString = process.env.RABBITMQ_URL;

    console.log('Tentando conectar ao RabbitMQ...');
    console.log(`Connection string: ${connectionString}`);

    try {
        const conn = await amqp.connect(connectionString);
        console.log('Conexão estabelecida com sucesso!');

        const channel = await conn.createChannel();
        console.log('Canal criado com sucesso!');

        // Tentar criar uma fila de teste
        const queueName = 'test_queue';
        await channel.assertQueue(queueName, { durable: true });
        console.log(`Fila ${queueName} criada/verificada com sucesso!`);

        // Publicar uma mensagem de teste
        await channel.sendToQueue(queueName, Buffer.from('test message'));
        console.log('Mensagem de teste publicada com sucesso!');

        // Fechar conexão
        await channel.close();
        await conn.close();
        console.log('Conexão fechada com sucesso!');
    } catch (error) {
        console.error('Erro:', error.message);
        if (error.code) {
            console.error('Código do erro:', error.code);
        }
        process.exit(1);
    }
}

testConnection();
