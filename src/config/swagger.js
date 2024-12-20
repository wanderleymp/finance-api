const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

// Carregar documentação dos módulos
const boletoSwagger = yaml.load(
    fs.readFileSync(
        path.join(__dirname, '../modules/boletos/docs/swagger.yaml'),
        'utf8'
    )
);

// Configuração base do Swagger
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Finance API',
        version: '1.0.0',
        description: 'API de gerenciamento financeiro',
        contact: {
            name: 'Time de Desenvolvimento',
            email: 'dev@example.com'
        }
    },
    servers: [
        {
            url: process.env.API_URL || 'http://localhost:3000',
            description: 'Servidor de desenvolvimento'
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
    },
    security: [
        {
            bearerAuth: []
        }
    ]
};

// Mesclar documentações
const mergedPaths = {
    ...boletoSwagger.paths
    // Adicionar outros módulos aqui
};

const mergedComponents = {
    ...swaggerDefinition.components,
    ...boletoSwagger.components
    // Adicionar outros módulos aqui
};

const options = {
    swaggerDefinition: {
        ...swaggerDefinition,
        paths: mergedPaths,
        components: mergedComponents
    },
    apis: [] // Não usamos anotações nos arquivos
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Finance API - Documentação',
        customfavIcon: '/favicon.ico'
    })
};
