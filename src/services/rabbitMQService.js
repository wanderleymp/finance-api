const amqp = require('amqplib');
const dotenv = require('dotenv');
const logger = require('../../config/logger');

dotenv.config();

class RabbitMQService {
    constructor() {
        // Definir filas padrão
        this.QUEUES = {
            BOLETO: 'boleto_generation_queue',
            NFSE: 'nfse_generation_queue',
            MESSAGE_INVOICE: 'message_invoice_queue'
        };
        
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        if (this.connection) return this.connection;

        const connectionString = process.env.RABBITMQ_URL;

        try {
            logger.info('Connecting to RabbitMQ...');
            
            this.connection = await amqp.connect(connectionString);
            this.channel = await this.connection.createChannel();
            
            // Garantir que as filas existem
            for (const [queueName] of Object.entries(this.QUEUES)) {
                await this.channel.assertQueue(queueName, { durable: true });
            }
            
            logger.info('Connected to RabbitMQ successfully');
            
            // Configurar tratamento de erro e reconexão
            this.connection.on('error', (err) => {
                logger.error('RabbitMQ connection error:', err);
                this.connection = null;
                this.channel = null;
            });

            this.connection.on('close', () => {
                logger.warn('RabbitMQ connection closed. Attempting to reconnect...');
                this.connection = null;
                this.channel = null;
                setTimeout(() => this.connect(), 5000);
            });

            return this.connection;
        } catch (error) {
            logger.error('Error connecting to RabbitMQ:', error);
            throw error;
        }
    }

    async createQueue(queueName) {
        if (!this.channel) await this.connect();
        await this.channel.assertQueue(queueName, { 
            durable: true,
            deadLetterExchange: 'dlx',
            deadLetterRoutingKey: `${queueName}.dlq`
        });

        // Criar Dead Letter Queue
        await this.channel.assertExchange('dlx', 'direct', { durable: true });
        await this.channel.assertQueue(`${queueName}.dlq`, { durable: true });
        await this.channel.bindQueue(`${queueName}.dlq`, 'dlx', `${queueName}.dlq`);

        return this.channel;
    }

    async sendToQueue(queueName, message) {
        if (!this.channel) await this.connect();
        await this.createQueue(queueName);
        
        const success = this.channel.sendToQueue(
            queueName, 
            Buffer.from(JSON.stringify(message)),
            { 
                persistent: true,
                contentType: 'application/json',
                timestamp: Date.now()
            }
        );

        if (!success) {
            throw new Error('Failed to send message to queue');
        }

        logger.info('Message sent to queue', { queue: queueName, message });
    }

    async consumeFromQueue(queueName, callback) {
        if (!this.channel) await this.connect();
        await this.createQueue(queueName);

        await this.channel.prefetch(1);
        
        await this.channel.consume(queueName, async (msg) => {
            if (!msg) return;

            try {
                const message = JSON.parse(msg.content.toString());
                await callback(message);
                this.channel.ack(msg);
            } catch (error) {
                logger.error('Error processing message:', error);
                
                // Se a mensagem já foi retentada muitas vezes, mova para DLQ
                const retryCount = (msg.properties.headers['x-death'] || []).length;
                if (retryCount >= 3) {
                    this.channel.reject(msg, false);
                } else {
                    // Retentar mais tarde
                    this.channel.nack(msg, false, true);
                }
            }
        });

        logger.info('Consumer started', { queue: queueName });
    }

    getBoletoQueue() {
        return this.QUEUES.BOLETO;
    }

    getNfseQueue() {
        return this.QUEUES.NFSE;
    }

    getMessageInvoiceQueue() {
        return this.QUEUES.MESSAGE_INVOICE;
    }

    async closeConnection() {
        if (this.channel) {
            await this.channel.close();
            this.channel = null;
        }
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
    }
}

module.exports = new RabbitMQService();
