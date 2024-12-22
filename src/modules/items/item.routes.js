const { Router } = require('express');
const ItemController = require('./item.controller');
const ItemService = require('./item.service');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const ItemSchema = require('./schemas/item.schema');

class ItemRoutes {
    constructor() {
        this.router = Router();
        this.itemController = new ItemController(new ItemService());
        this.setupRoutes();
    }

    setupRoutes() {
        // Todas as rotas são protegidas
        this.router.use(authMiddleware);

        // Rotas RESTful básicas
        this.router
            .get('/', 
                this.itemController.findAll.bind(this.itemController)
            )
            .get('/:id', 
                this.itemController.findById.bind(this.itemController)
            )
            .post('/', 
                (req, res, next) => validateSchema(ItemSchema.create, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.itemController.create.bind(this.itemController)
            )
            .put('/:id', 
                (req, res, next) => validateSchema(ItemSchema.update, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.itemController.update.bind(this.itemController)
            )
            .delete('/:id', 
                this.itemController.delete.bind(this.itemController)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new ItemRoutes();
