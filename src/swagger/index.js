const swaggerJsdoc = require('swagger-jsdoc');

// Importar todos os schemas
require('./schemas/person');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agile Finance API',
      version: '1.0.0',
      description: 'API para o sistema Agile Finance'
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'API Server'
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
  },
  apis: [
    './src/routes/*.js',
    './src/swagger/schemas/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
