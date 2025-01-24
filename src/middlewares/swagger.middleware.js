const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Armazenamento de Arquivos',
      version: '1.0.0',
      description: 'Documentação da API de Armazenamento de Arquivos'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento'
      }
    ]
  },
  apis: [
    './src/newArch/fileStorage/application/controllers/file-storage.controller.ts'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerMiddleware(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = swaggerMiddleware;
