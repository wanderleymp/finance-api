const { Router } = require('express');
const TaskDependenciesController = require('./taskdependencies.controller');
const TaskDependenciesService = require('./taskdependencies.service');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const TaskDependenciesSchema = require('./schemas/taskdependencies.schema');

class TaskDependenciesRoutes {
    constructor() {
        this.router = Router();
        this.taskDependenciesController = new TaskDependenciesController(new TaskDependenciesService());
        this.setupRoutes();
    }

    setupRoutes() {
        // Todas as rotas são protegidas
        this.router.use(authMiddleware);

        // Rotas RESTful básicas
        this.router
            .get('/', 
                this.taskDependenciesController.findAll.bind(this.taskDependenciesController)
            )
            .get('/:id', 
                this.taskDependenciesController.findById.bind(this.taskDependenciesController)
            )
            .post('/', 
                (req, res, next) => validateSchema(TaskDependenciesSchema.create, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.taskDependenciesController.create.bind(this.taskDependenciesController)
            )
            .put('/:id',
                (req, res, next) => validateSchema(TaskDependenciesSchema.update, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.taskDependenciesController.update.bind(this.taskDependenciesController)
            )
            .delete('/:id',
                this.taskDependenciesController.delete.bind(this.taskDependenciesController)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new TaskDependenciesRoutes();
