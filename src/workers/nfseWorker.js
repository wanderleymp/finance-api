const nfseRabbitMQService = require('../services/nfseRabbitMQService');

async function startWorker() {
    try {
        await nfseRabbitMQService.processNfseGenerationQueue();
    } catch (error) {
        console.error('Error starting NFSe worker:', error);
        process.exit(1);
    }
}

startWorker();
