const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// Configuração base do Swagger
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Finance API',
            version: '1.0.0',
            description: 'API para gestão financeira'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desenvolvimento local'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: [
        path.join(__dirname, '../modules/**/routes.js'),
        path.join(__dirname, '../modules/**/docs/*.yaml'),
        path.join(__dirname, '../modules/**/docs/*.js')
    ]
};

module.exports = swaggerJsdoc(options);
