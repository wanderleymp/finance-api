const { Router } = require('express');
const TaskController = require('./task.controller');
const TaskService = require('./services/task.service');
const TaskRepository = require('./repositories/task.repository');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const TaskSchema = require('./schemas/task.schema');

class TaskRoutes {
    constructor() {
        this.router = Router();
        const taskRepository = new TaskRepository();
        const taskService = new TaskService({ taskRepository });
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
            .get('/metrics',
                this.taskController.getMetrics.bind(this.taskController)
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
