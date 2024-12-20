const { logger } = require('../middlewares/logger');

class ProcessorManager {
    constructor() {
        this.processors = new Map();
    }

    registerProcessor(processor) {
        const taskType = processor.getTaskType();
        this.processors.set(taskType, processor);
        logger.info(`Processador registrado para tipo ${taskType}`);
    }

    getProcessor(taskType) {
        return this.processors.get(taskType);
    }

    hasProcessor(taskType) {
        return this.processors.has(taskType);
    }
}

// Criar instância única
const processorManager = new ProcessorManager();

// Registrar processadores
const boletoProcessor = require('./boletoProcessor');
const nfseProcessor = require('./nfseProcessor');

processorManager.registerProcessor(boletoProcessor);
processorManager.registerProcessor(nfseProcessor);

module.exports = processorManager;
