const { initializeTaskWorker } = require('./init');
const TaskService = require('./task.service');
const TaskController = require('./task.controller');
const TaskRouter = require('./task.router');

module.exports = {
    initializeTaskWorker,
    TaskService,
    TaskController,
    TaskRouter
};
