const path = require('path');

// Carrega a especificação Swagger gerada
let swaggerSpec;
try {
    swaggerSpec = require('../docs/swagger.json');
} catch (error) {
    console.error('Erro ao carregar documentação Swagger. Execute: node scripts/generate-swagger.js');
    // Fornece uma especificação mínima para evitar erros
    swaggerSpec = {
        openapi: '3.0.0',
        info: {
            title: 'Finance API',
            version: '1.0.0',
            description: 'API para gestão financeira (Documentação não gerada)'
        },
        paths: {}
    };
}

module.exports = swaggerSpec;
