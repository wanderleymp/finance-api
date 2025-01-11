const { Router } = require('express');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const TaskSchema = require('./schemas/task.schema');
const { logger } = require('../../middlewares/logger');

class TaskRoutes {
    constructor(taskController) {
        logger.info('Inicializando TaskRoutes', {
            controllerExists: !!taskController,
            controllerType: typeof taskController,
            controllerMethods: taskController ? Object.keys(taskController) : 'N/A'
        });

        if (!taskController) {
            throw new Error('TaskController não pode ser undefined');
        }

        this.router = Router();
        this.taskController = taskController;
        this.setupRoutes();
    }

    setupRoutes() {
        // Todas as rotas são protegidas
        this.router.use(authMiddleware);

        // Rotas principais
        this.router
            .post('/',
                (req, res, next) => validateSchema(TaskSchema.create, req.body)
                    .then(() => next())
                    .catch(next),
                this.taskController.create.bind(this.taskController)
            )
            .get('/',
                (req, res, next) => validateSchema(TaskSchema.query, req.query)
                    .then(() => next())
                    .catch(next),
                this.taskController.findAll.bind(this.taskController)
            )
            .get('/:id',
                this.taskController.findById.bind(this.taskController)
            )
            .put('/:id',
                (req, res, next) => validateSchema(TaskSchema.update, req.body)
                    .then(() => next())
                    .catch(next),
                this.taskController.update.bind(this.taskController)
            )
            .delete('/:id',
                this.taskController.delete.bind(this.taskController)
            )
            .post('/:id/reschedule',
                this.taskController.rescheduleTask.bind(this.taskController)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = TaskRoutes;
