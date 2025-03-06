const path = require('path');
const fs = require('fs');

// Carrega a especificação Swagger gerada
let swaggerSpec;
try {
    const swaggerJsonPath = path.join(__dirname, '../docs/swagger.json');
    
    // Verifica se o arquivo existe
    if (fs.existsSync(swaggerJsonPath)) {
        swaggerSpec = require('../docs/swagger.json');
        console.log('Documentação Swagger carregada com sucesso');
    } else {
        throw new Error('Arquivo swagger.json não encontrado');
    }
} catch (error) {
    console.error(`Erro ao carregar documentação Swagger: ${error.message}`);
    console.error('Execute: node scripts/generate-swagger.js para gerar a documentação');
    
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
