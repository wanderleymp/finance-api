const { Router } = require('express');
const TaskTypesController = require('./tasktypes.controller');
const TaskTypesService = require('./tasktypes.service');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const TaskTypesSchema = require('./schemas/tasktypes.schema');

class TaskTypesRoutes {
    constructor() {
        this.router = Router();
        this.taskTypesController = new TaskTypesController(new TaskTypesService());
        this.setupRoutes();
    }

    setupRoutes() {
        // Rotas públicas
        this.router.get('/active', 
            this.taskTypesController.getActiveTypes.bind(this.taskTypesController)
        );

        // Todas as outras rotas são protegidas
        this.router.use(authMiddleware);

        // Rotas RESTful básicas
        this.router
            .get('/', 
                this.taskTypesController.findAll.bind(this.taskTypesController)
            )
            .get('/:id', 
                this.taskTypesController.findById.bind(this.taskTypesController)
            )
            .post('/', 
                (req, res, next) => validateSchema(TaskTypesSchema.create, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.taskTypesController.create.bind(this.taskTypesController)
            )
            .put('/:id',
                (req, res, next) => validateSchema(TaskTypesSchema.update, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.taskTypesController.update.bind(this.taskTypesController)
            )
            .delete('/:id',
                this.taskTypesController.delete.bind(this.taskTypesController)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new TaskTypesRoutes();
