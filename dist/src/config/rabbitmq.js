"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.channel = exports.connection = void 0;
exports.connectRabbitMQ = connectRabbitMQ;
exports.closeRabbitMQ = closeRabbitMQ;
exports.assertQueue = assertQueue;
const amqplib_1 = __importDefault(require("amqplib"));
let connection = null;
exports.connection = connection;
let channel = null;
exports.channel = channel;
async function connectRabbitMQ() {
    try {
        // Usar variável de ambiente para URL de conexão
        const rabbitmqUrl = process.env.RABBITMQ_URL;
        if (!rabbitmqUrl) {
            throw new Error('RABBITMQ_URL não configurada');
        }
        // Estabelecer conexão
        exports.connection = connection = await amqplib_1.default.connect(rabbitmqUrl);
        // Criar canal
        exports.channel = channel = await connection.createChannel();
        console.log('✅ Conexão com RabbitMQ estabelecida');
        // Adicionar listener para reconexão em caso de falha
        connection.on('close', () => {
            console.error('❌ Conexão com RabbitMQ perdida. Tentando reconectar...');
            setTimeout(connectRabbitMQ, 5000);
        });
        return { connection, channel };
    }
    catch (error) {
        console.error('❌ Erro ao conectar ao RabbitMQ:', error);
        // Tentar reconectar após 5 segundos em caso de erro
        setTimeout(connectRabbitMQ, 5000);
        throw error;
    }
}
async function closeRabbitMQ() {
    if (channel)
        await channel.close();
    if (connection)
        await connection.close();
}
async function assertQueue(queueName) {
    if (!channel) {
        throw new Error('Canal RabbitMQ não inicializado');
    }
    await channel.assertQueue(queueName, { durable: true });
}
