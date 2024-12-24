const EmailProcessor = require('./processors/email.processor');

module.exports = (taskService, taskWorker) => {
    // Registra o processador de email
    const emailProcessor = new EmailProcessor(taskService);
    taskWorker.registerProcessor(emailProcessor);
    
    return {
        success: true,
        message: 'Processador de email registrado com sucesso'
    };
};
