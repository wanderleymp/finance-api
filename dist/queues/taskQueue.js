"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_QUEUE_NAME = void 0;
exports.publishTask = publishTask;
exports.consumeTasks = consumeTasks;
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
        const message = JSON.stringify({
            taskName,
            payload,
            timestamp: new Date().toISOString()
        });
        const sent = rabbitmq_1.channel.sendToQueue(TASK_QUEUE, Buffer.from(message), {
            persistent: true
        });
        console.log(`📋 Tarefa "${taskName}" enviada para fila`);
        return sent;
    }
    catch (error) {
        console.error('Erro ao publicar tarefa:', error);
        throw error;
    }
}
async function consumeTasks(onMessage) {
    if (!rabbitmq_1.channel) {
        throw new Error('Canal RabbitMQ não inicializado');
    }
    await (0, rabbitmq_1.assertQueue)(TASK_QUEUE);
    rabbitmq_1.channel.consume(TASK_QUEUE, async (msg) => {
        if (msg) {
            try {
                const content = JSON.parse(msg.content.toString());
                // Validar conteúdo da mensagem antes de processar
                validatePayload(content.taskName, content.payload);
                await onMessage(content);
                rabbitmq_1.channel.ack(msg);
            }
            catch (error) {
                console.error('Erro ao processar tarefa:', error);
                rabbitmq_1.channel.nack(msg, false, false);
            }
        }
    });
    console.log('🚀 Consumidor de tarefas iniciado');
}
exports.TASK_QUEUE_NAME = TASK_QUEUE;
