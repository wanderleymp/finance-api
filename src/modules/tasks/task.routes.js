const { Router } = require('express');
const TaskController = require('./task.controller');
const TaskService = require('./task.service');
const TaskRepository = require('./repositories/task.repository');
const TaskLogsService = require('./services/task-logs.service');
const TaskLogsController = require('./controllers/task-logs.controller');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const TaskSchema = require('./schemas/task.schema');
const TaskLogsSchema = require('./schemas/task-logs.schema');

class TaskRoutes {
    constructor() {
        this.router = Router();
        
        // Inicializa os serviços necessários
        const taskRepository = new TaskRepository();
        const taskLogsService = new TaskLogsService();
        const taskDependenciesService = new TaskDependenciesService();
        
        // Cria o serviço com todas as dependências
        const taskService = new TaskService({
            taskRepository,
            taskLogsService,
            taskDependenciesService
        });
        
        this.taskController = new TaskController(taskService);
        this.taskLogsController = new TaskLogsController(taskLogsService);
        this.setupRoutes();
    }

    setupRoutes() {
        // Todas as rotas são protegidas
        this.router.use(authMiddleware);

        // Rotas de logs (precisam vir antes das rotas com :id)
        this.router
            .get('/logs',
                (req, res, next) => validateSchema(TaskLogsSchema.query, req.query)
                    .then(() => next())
                    .catch(next),
                this.taskLogsController.findLogs.bind(this.taskLogsController)
            )
            .get('/logs/:id',
                this.taskLogsController.findLogById.bind(this.taskLogsController)
            );

        // Rotas específicas (também precisam vir antes das rotas com :id)
        this.router
            .get('/pending',
                this.taskController.findPendingTasks.bind(this.taskController)
            )
            .post('/:id/process',
                this.taskController.processTask.bind(this.taskController)
            )
            .post('/:taskId/reschedule',
                this.taskController.rescheduleTask.bind(this.taskController)
            );

        // Rotas RESTful básicas
        this.router
            .get('/', 
                this.taskController.findAll.bind(this.taskController)
            )
            .get('/:id', 
                this.taskController.findById.bind(this.taskController)
            )
            .post('/', 
                (req, res, next) => validateSchema(TaskSchema.create, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.taskController.create.bind(this.taskController)
            )
            .put('/:id',
                (req, res, next) => validateSchema(TaskSchema.update, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.taskController.update.bind(this.taskController)
            )
            .delete('/:id',
                this.taskController.delete.bind(this.taskController)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new TaskRoutes();
