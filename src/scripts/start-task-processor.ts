import { taskProcessorService } from '../services/task-processor.service';
import { logger } from '../utils/logger';

async function startTaskProcessor() {
  try {
    logger.info('Iniciando processador de tarefas...');
    await taskProcessorService.startTaskProcessing();
    logger.info('Processador de tarefas iniciado com sucesso.');
  } catch (error) {
    logger.error('Erro ao iniciar processador de tarefas:', error);
    process.exit(1);
  }
}

startTaskProcessor();
