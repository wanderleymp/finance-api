require('dotenv').config();
const BoletoRabbitMQService = require('../src/services/boletoRabbitMQService');
const NfseRabbitMQService = require('../src/services/nfseRabbitMQService');
const logger = require('../config/logger');

async function startWorkers() {
    try {
        logger.info('🚀 Iniciando workers do RabbitMQ...');

        // Iniciar processamento de filas
        await Promise.all([
            BoletoRabbitMQService.processBoletoGenerationQueue(),
            NfseRabbitMQService.processNfseGenerationQueue()
        ]);

        logger.info('✅ Workers do RabbitMQ iniciados com sucesso!');
    } catch (error) {
        logger.error('❌ Erro ao iniciar workers do RabbitMQ:', error);
        process.exit(1);
    }
}

startWorkers();
