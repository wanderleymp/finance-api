// Carregar variáveis de ambiente de forma centralizada
const { loadEnvironmentVariables, env } = require('./src/config/env');

// Adicionar log de carregamento
console.log('Variáveis de ambiente carregadas:', env);

const app = require('./src/app');
const http = require('http');
const { logger } = require('./src/middlewares/logger');
const { systemDatabase } = require('./src/config/database');

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
    console.error('FATAL: Exceção não capturada:', error);
    logger.error('Exceção não capturada', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

// Tratamento de rejeições de promessas não tratadas
process.on('unhandledRejection', (reason, promise) => {
    console.error('FATAL: Rejeição de promessa não tratada:', reason);
    logger.error('Rejeição de promessa não tratada', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : 'Sem stack trace'
    });
    process.exit(1);
});

async function startServer() {
    try {
        console.log('DEBUG: Iniciando servidor');
        console.log('Variáveis de ambiente:', {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL: process.env.DATABASE_URL,
            SYSTEM_DATABASE_URL: process.env.SYSTEM_DATABASE_URL,
            PORT: process.env.PORT
        });

        console.log('DEBUG: Testando conexão com banco de dados');
        // Testar conexão com banco
        const connectionResult = await systemDatabase.testConnection();
        console.log('DEBUG: Resultado da conexão:', connectionResult);

        const port = process.env.PORT || 3000;
        
        console.log(`DEBUG: Criando servidor na porta ${port}`);
        const server = http.createServer(app);
        
        // Adicionar listeners de erro mais detalhados
        server.on('error', (error) => {
            console.error('DEBUG: Erro crítico no servidor:', error);
            logger.error('Erro crítico no servidor', {
                error: error.message,
                code: error.code,
                stack: error.stack
            });
            process.exit(1);
        });

        server.on('listening', () => {
            console.log(`DEBUG: Servidor escutando na porta ${port}`);
            logger.info(`Servidor escutando na porta ${port}`);
        });

        server.listen(port);

    } catch (error) {
        console.error('DEBUG: Erro crítico ao iniciar servidor:', error);
        logger.error('Erro crítico ao iniciar servidor', { 
            error: error.message, 
            stack: error.stack 
        });
        process.exit(1);
    }
}

startServer();
