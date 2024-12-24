const { Router } = require('express');
const TaskLogsController = require('./tasklogs.controller');
const TaskLogsService = require('./tasklogs.service');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const TaskLogsSchema = require('./schemas/tasklogs.schema');

class TaskLogsRoutes {
    constructor() {
        this.router = Router();
        this.taskLogsController = new TaskLogsController(new TaskLogsService());
        this.setupRoutes();
    }

    setupRoutes() {
        // Todas as rotas são protegidas
        this.router.use(authMiddleware);

        // Rotas RESTful básicas
        this.router
            .get('/', 
                this.taskLogsController.findAll.bind(this.taskLogsController)
            )
            .get('/:id', 
                this.taskLogsController.findById.bind(this.taskLogsController)
            )
            .post('/', 
                (req, res, next) => validateSchema(TaskLogsSchema.create, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.taskLogsController.create.bind(this.taskLogsController)
            );

        // Rotas específicas para tasks
        this.router
            .get('/task/:taskId',
                this.taskLogsController.findByTaskId.bind(this.taskLogsController)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new TaskLogsRoutes();
