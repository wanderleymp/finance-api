const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

module.exports = () => {
    const router = express.Router();

    // Rota da documentação
    router.use('/', swaggerUi.serve);
    router.get('/', swaggerUi.setup(swaggerSpec));

    return router;
};
