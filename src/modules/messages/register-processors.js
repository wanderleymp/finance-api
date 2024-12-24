const EmailProcessor = require('./processors/email.processor');
const TaskService = require('../tasks/task.service');
const TaskRepository = require('../tasks/repositories/task.repository');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');

function registerMessageProcessors() {
    const taskRepository = new TaskRepository();
    const taskLogsService = new TaskLogsService();
    const taskDependenciesService = new TaskDependenciesService();
    
    const taskService = new TaskService({ 
        taskRepository,
        taskLogsService,
        taskDependenciesService
    });
    
    const emailProcessor = new EmailProcessor(taskService);
    
    // Registra o processador de email
    taskService.registerProcessor(emailProcessor);
}

module.exports = registerMessageProcessors;
