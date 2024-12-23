const { Router } = require('express');
const { validateSchema } = require('../../utils/validateSchema');
const AuthSchema = require('./schemas/auth.schema');
const { authMiddleware } = require('../../middlewares/auth');

class AuthRoutes {
    constructor(controller) {
        this.router = Router();
        this.controller = controller;
        this.setupRoutes();
    }

    setupRoutes() {
        // Rotas públicas
        this.router
            .post('/login', 
                (req, res, next) => validateSchema(AuthSchema.login, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.controller.login.bind(this.controller)
            )
            .post('/refresh', 
                (req, res, next) => validateSchema(AuthSchema.refresh, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.controller.refreshToken.bind(this.controller)
            );

        // Rotas protegidas
        this.router.post('/logout', 
            authMiddleware,
            this.controller.logout.bind(this.controller)
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = AuthRoutes;
