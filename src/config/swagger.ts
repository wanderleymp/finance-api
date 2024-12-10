import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Finance API',
    version: '1.1.2',
    description: 'API de gerenciamento financeiro com autenticação e tarefas',
    contact: {
      name: 'Suporte Técnico',
      email: 'suporte@financeapi.com'
    }
  },
  servers: [
    {
      url: 'http://162.55.160.99:3000',
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
  }
};

const options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
    './src/controllers/*.ts',
    './src/controllers/**/*.ts'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
