import { ConsumeMessage } from 'amqplib';
import logger from '../config/logger';
import { processTaskMessage } from '../services/taskService';
import { channel, assertQueue } from '../config/rabbitmq';

const TASK_QUEUE = 'tasks_queue';

function validatePayload(taskName: string, payload: any) {
  if (!taskName || typeof taskName !== 'string') {
    throw new Error('taskName deve ser uma string não vazia');
  }

  if (payload && typeof payload !== 'object') {
    throw new Error('Payload deve ser um objeto válido');
  }
}

export async function publishTask(taskName: string, payload: any = {}) {
  try {
    // Validar entrada
    validatePayload(taskName, payload);

    if (!channel) {
      throw new Error('Canal RabbitMQ não inicializado');
    }

    await assertQueue(TASK_QUEUE);

    channel.sendToQueue(
      TASK_QUEUE, 
      Buffer.from(JSON.stringify({ taskName, payload, timestamp: new Date().toISOString() })),
      { persistent: true }
    );

    console.log(`📋 Tarefa "${taskName}" publicada com sucesso`);
  } catch (error) {
    console.error('Erro ao publicar tarefa:', error);
    throw error;
  }
}

async function processTask(msg: ConsumeMessage | null) {
  if (!msg || !channel) return;

  try {
    const content = JSON.parse(msg.content.toString());
    logger.info('Processando tarefa', { content });

    // Processar tarefa
    const result = await processTaskMessage(content);

    if (result) {
      channel.ack(msg);
    } else {
      channel.nack(msg, false, false);
    }
  } catch (error) {
    logger.error('Erro ao processar tarefa', { error });
    channel.nack(msg, false, false);
  }
}

export async function consumeTasks(onMessage: (msg: any) => Promise<void>) {
  if (!channel) {
    console.error('Canal do RabbitMQ não disponível');
    return;
  }

  try {
    await assertQueue(TASK_QUEUE);
    await channel.consume(TASK_QUEUE, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await onMessage(content);
          channel?.ack(msg);
        } catch (error) {
          console.error('Erro ao processar tarefa:', error);
          channel?.nack(msg, false, false);
        }
      }
    }, { noAck: false });

    console.log('🚀 Consumidor de tarefas iniciado');
  } catch (error) {
    console.error('Erro ao iniciar consumidor de tarefas:', error);
  }
}

export const TASK_QUEUE_NAME = TASK_QUEUE;
