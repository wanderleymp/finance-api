require('dotenv').config();
const BoletoService = require('../src/services/boletoRabbitMqService');
const logger = require('../config/logger');

async function testBoletoGeneration() {
    try {
        // Agendar um boleto para ser gerado imediatamente
        const now = new Date();
        const movementId = 1; // Substitua pelo ID do movimento real

        logger.info('Agendando geração de boleto...');
        const result = await BoletoService.publishBoletoGenerationTask(movementId, now);
        logger.info('Boleto agendado:', result);

        // Processar a fila por no máximo 10 segundos
        logger.info('Processando fila de boletos (timeout: 10s)...');
        const timeout = setTimeout(() => {
            logger.info('Timeout atingido, parando processamento...');
            process.exit(0);
        }, 10000);

        try {
            await BoletoService.processBoletoGenerationQueue();
        } catch (error) {
            logger.error('Erro ao processar fila:', error);
        } finally {
            clearTimeout(timeout);
        }

        // Verificar o status
        logger.info('Verificando status...');
        const status = await BoletoService.getBoletoStatus(result.task_id);
        logger.info('Status final:', status);

    } catch (error) {
        logger.error('Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testBoletoGeneration();
