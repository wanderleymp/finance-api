const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../../config/swagger');

class DocsController {
    constructor() {
        this.serve = swaggerUi.serve;
        this.setup = swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Finance API - Documentação',
            customfavIcon: '/favicon.ico'
        });
    }
}

module.exports = DocsController;
