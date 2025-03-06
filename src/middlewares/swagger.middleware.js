const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

/**
 * Middleware para configurar a documentação Swagger
 * 
 * Este middleware configura a rota /api-docs para servir a documentação Swagger
 * usando a mesma especificação que é usada na rota /docs no arquivo app.js
 * 
 * @param {Object} app - Express app
 */
function swaggerMiddleware(app) {
  // Configuração avançada do Swagger UI
  const swaggerUiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true
    }
  };

  // Configura a rota /api-docs para servir a documentação Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // Log para confirmar que o middleware foi carregado
  console.log('Swagger middleware carregado com sucesso na rota /api-docs');
}

module.exports = swaggerMiddleware;
