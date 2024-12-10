"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_QUEUE_NAME = void 0;
exports.publishTask = publishTask;
exports.consumeTasks = consumeTasks;
const logger_1 = __importDefault(require("../config/logger"));
const taskService_1 = require("../services/taskService");
const rabbitmq_1 = require("../config/rabbitmq");
const TASK_QUEUE = 'tasks_queue';
function validatePayload(taskName, payload) {
    if (!taskName || typeof taskName !== 'string') {
        throw new Error('taskName deve ser uma string não vazia');
    }
    if (payload && typeof payload !== 'object') {
        throw new Error('Payload deve ser um objeto válido');
    }
}
async function publishTask(taskName, payload = {}) {
    try {
        // Validar entrada
        validatePayload(taskName, payload);
        if (!rabbitmq_1.channel) {
            throw new Error('Canal RabbitMQ não inicializado');
        }
        await (0, rabbitmq_1.assertQueue)(TASK_QUEUE);
        rabbitmq_1.channel.sendToQueue(TASK_QUEUE, Buffer.from(JSON.stringify({ taskName, payload, timestamp: new Date().toISOString() })), { persistent: true });
        console.log(`📋 Tarefa "${taskName}" publicada com sucesso`);
    }
    catch (error) {
        console.error('Erro ao publicar tarefa:', error);
        throw error;
    }
}
async function processTask(msg) {
    if (!msg || !rabbitmq_1.channel)
        return;
    try {
        const content = JSON.parse(msg.content.toString());
        logger_1.default.info('Processando tarefa', { content });
        // Processar tarefa
        const result = await (0, taskService_1.processTaskMessage)(content);
        if (result) {
            rabbitmq_1.channel.ack(msg);
        }
        else {
            rabbitmq_1.channel.nack(msg, false, false);
        }
    }
    catch (error) {
        logger_1.default.error('Erro ao processar tarefa', { error });
        rabbitmq_1.channel.nack(msg, false, false);
    }
}
async function consumeTasks(onMessage) {
    if (!rabbitmq_1.channel) {
        console.error('Canal do RabbitMQ não disponível');
        return;
    }
    try {
        await (0, rabbitmq_1.assertQueue)(TASK_QUEUE);
        await rabbitmq_1.channel.consume(TASK_QUEUE, async (msg) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    await onMessage(content);
                    rabbitmq_1.channel?.ack(msg);
                }
                catch (error) {
                    console.error('Erro ao processar tarefa:', error);
                    rabbitmq_1.channel?.nack(msg, false, false);
                }
            }
        }, { noAck: false });
        console.log('🚀 Consumidor de tarefas iniciado');
    }
    catch (error) {
        console.error('Erro ao iniciar consumidor de tarefas:', error);
    }
}
exports.TASK_QUEUE_NAME = TASK_QUEUE;
//# sourceMappingURL=taskQueue.js.map