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

    const message = JSON.stringify({
      taskName,
      payload,
      timestamp: new Date().toISOString()
    });

    const sent = channel.sendToQueue(TASK_QUEUE, Buffer.from(message), {
      persistent: true
    });

    console.log(`📋 Tarefa "${taskName}" enviada para fila`);
    return sent;
  } catch (error) {
    console.error('Erro ao publicar tarefa:', error);
    throw error;
  }
}

export async function consumeTasks(onMessage: (msg: any) => Promise<void>) {
  if (!channel) {
    throw new Error('Canal RabbitMQ não inicializado');
  }

  await assertQueue(TASK_QUEUE);

  channel.consume(TASK_QUEUE, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        
        // Validar conteúdo da mensagem antes de processar
        validatePayload(content.taskName, content.payload);
        
        await onMessage(content);
        channel.ack(msg);
      } catch (error) {
        console.error('Erro ao processar tarefa:', error);
        channel.nack(msg, false, false);
      }
    }
  });

  console.log('🚀 Consumidor de tarefas iniciado');
}

export const TASK_QUEUE_NAME = TASK_QUEUE;
