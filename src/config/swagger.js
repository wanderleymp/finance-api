const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

// Configuração base do Swagger
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Finance API',
        version: '1.0.0',
        description: 'API para gestão financeira'
    },
    servers: [
        {
            url: 'http://localhost:3000/api/v1',
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
    },
    security: [
        {
            bearerAuth: []
        }
    ]
};

// Carregar documentação dos módulos
const boletoSwagger = yaml.load(
    fs.readFileSync(
        path.join(__dirname, '../modules/boletos/docs/swagger.yaml'),
        'utf8'
    )
);

const healthSwagger = yaml.load(
    fs.readFileSync(
        path.join(__dirname, '../modules/health/docs/swagger.yaml'),
        'utf8'
    )
);

const addressSwagger = yaml.load(
    fs.readFileSync(
        path.join(__dirname, '../modules/addresses/docs/swagger.yaml'),
        'utf8'
    )
);

// Mesclar documentações
swaggerDefinition.paths = {
    ...boletoSwagger.paths,
    ...healthSwagger.paths,
    ...addressSwagger.paths
};

swaggerDefinition.components = {
    ...swaggerDefinition.components,
    ...(boletoSwagger.components || {}),
    ...(healthSwagger.components || {}),
    ...(addressSwagger.components || {})
};

const options = {
    definition: swaggerDefinition,
    apis: [] // Não precisamos disso já que estamos usando YAML
};

module.exports = swaggerJsdoc(options);
