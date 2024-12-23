const { Router } = require('express');
const { validateSchema } = require('../../utils/validateSchema');
const UserSchema = require('./schemas/user.schema');
const { authMiddleware } = require('../../middlewares/auth');

class UserRoutes {
    constructor(controller) {
        this.router = Router();
        this.controller = controller;
        this.setupRoutes();
    }

    setupRoutes() {
        // Rota pública
        this.router.post('/refresh', 
            (req, res, next) => validateSchema(UserSchema.refresh, req.body)
                .then(validatedData => {
                    req.body = validatedData;
                    next();
                })
                .catch(next),
            this.controller.refreshToken.bind(this.controller)
        );

        // Rotas protegidas
        this.router.use(authMiddleware);

        this.router
            .get('/', 
                this.controller.findAll.bind(this.controller)
            )
            .get('/:id', 
                this.controller.findById.bind(this.controller)
            )
            .post('/', 
                (req, res, next) => validateSchema(UserSchema.create, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.controller.create.bind(this.controller)
            )
            .put('/:id', 
                (req, res, next) => validateSchema(UserSchema.update, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.controller.update.bind(this.controller)
            )
            .delete('/:id', 
                this.controller.delete.bind(this.controller)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = UserRoutes;
