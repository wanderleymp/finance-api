const { Router } = require('express');
const TaskController = require('./task.controller');
const TaskService = require('./task.service');
const TaskRepository = require('./repositories/task.repository');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const TaskSchema = require('./schemas/task.schema');

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
        this.setupRoutes();
    }

    setupRoutes() {
        // Todas as rotas são protegidas
        this.router.use(authMiddleware);

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

        // Rotas específicas
        this.router
            .get('/pending',
                this.taskController.findPendingTasks.bind(this.taskController)
            )
            .post('/:id/process',
                this.taskController.processTask.bind(this.taskController)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new TaskRoutes();
