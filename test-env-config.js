const { 
    loadEnvironmentVariables, 
    validateEnvironment, 
    ENV_SCHEMA 
} = require('./src/config/env');

console.log('Testando configuração de ambiente');

// Função para simular diferentes cenários de configuração
function testEnvironmentConfiguration(testEnv) {
    console.log('\n--- Testando configuração:', testEnv);
    
    // Limpar variáveis de ambiente existentes
    Object.keys(process.env).forEach(key => {
        if (key.startsWith('TEST_')) {
            delete process.env[key];
        }
    });

    // Definir variáveis de ambiente de teste
    Object.entries(testEnv).forEach(([key, value]) => {
        process.env[key] = value;
    });

    try {
        // Carregar e validar variáveis de ambiente
        const loadedEnv = loadEnvironmentVariables();
        
        console.log('Variáveis carregadas:');
        Object.entries(loadedEnv)
            .filter(([key]) => ENV_SCHEMA.required.includes(key) || ENV_SCHEMA.optional.includes(key))
            .forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });

        // Validar ambiente
        const validationErrors = validateEnvironment(loadedEnv);
        
        if (validationErrors.length > 0) {
            console.error('Erros de validação:');
            validationErrors.forEach(error => console.error(`  - ${error}`));
            return false;
        }

        console.log('✅ Configuração válida');
        return true;
    } catch (error) {
        console.error('❌ Erro na configuração:', error);
        return false;
    }
}

// Cenários de teste
const testScenarios = [
    // Cenário 1: Configuração mínima válida
    {
        SYSTEM_DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        JWT_SECRET: 'um-segredo-muito-secreto-e-longo',
        PORT: '3000'
    },
    
    // Cenário 2: Faltando variáveis obrigatórias
    {
        SYSTEM_DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb'
    },
    
    // Cenário 3: Porta inválida
    {
        SYSTEM_DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        JWT_SECRET: 'um-segredo-muito-secreto-e-longo',
        PORT: '99999'
    },
    
    // Cenário 4: URL de banco de dados inválida
    {
        SYSTEM_DATABASE_URL: 'invalid-database-url',
        JWT_SECRET: 'um-segredo-muito-secreto-e-longo',
        PORT: '3000'
    }
];

// Executar testes
console.log('\n=== INICIANDO TESTES DE CONFIGURAÇÃO DE AMBIENTE ===');
testScenarios.forEach((scenario, index) => {
    console.log(`\nCenário ${index + 1}:`);
    const result = testEnvironmentConfiguration(scenario);
    console.log(`Resultado: ${result ? 'SUCESSO' : 'FALHA'}\n`);
});
