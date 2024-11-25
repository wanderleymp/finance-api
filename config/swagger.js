const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agile Finance API',
      version: '1.0.0',
      description: 'Documentação da API para o backend do Agile Finance',
    },
    servers: [
      {
        url: 'https://api.agilefinance.com.br',
        description: 'Servidor de Produção'
      },
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      }
    ],
  },
  apis: ['./src/routes/*.js'], // Caminho para os arquivos que contêm as rotas
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
