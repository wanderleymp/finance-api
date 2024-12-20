const config = require('./jest.config');

module.exports = {
    ...config,
    testMatch: [
        '**/src/**/__tests__/**/*.integration.test.js'
    ],
    // Aumentar timeout para testes de integração
    testTimeout: 30000,
    // Não verificar cobertura em testes de integração
    collectCoverage: false
};
