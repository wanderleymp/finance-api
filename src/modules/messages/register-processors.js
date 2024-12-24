const EmailProcessor = require('./processors/email.processor');
const TaskService = require('../tasks/task.service');

function registerMessageProcessors() {
    const taskService = new TaskService();
    const emailProcessor = new EmailProcessor(taskService);
    
    // Registra o processador de email
    taskService.registerProcessor(emailProcessor);
}

module.exports = registerMessageProcessors;
