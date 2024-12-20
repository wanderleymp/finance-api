const app = require('./app');
const { logger } = require('./middlewares/logger');
const { connectToDatabase } = require('./config/database');
require('dotenv').config();

// Configuração da porta
const PORT = process.env.PORT || 3000;

// Função para iniciar o servidor em uma porta específica
function startServerOnPort(port) {
    return new Promise((resolve, reject) => {
        const server = app.listen(port)
            .once('listening', () => {
                const actualPort = server.address().port;
                logger.info(`🚀 Servidor inicializado na porta ${actualPort}`, {
                    port: actualPort,
                    environment: process.env.NODE_ENV
                });
                resolve(server);
            })
            .once('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    logger.error(`Porta ${port} já está em uso`);
                    server.close();
                    resolve(null);
                } else {
                    reject(error);
                }
            });
    });
}

// Inicialização do servidor
async function startServer() {
    try {
        // Conectar ao banco de dados
        logger.info('Configurando conexão com banco AgileDB');
        await connectToDatabase();

        // Tentar porta principal
        let server = await startServerOnPort(PORT);
        
        // Se a porta principal falhar, tentar uma porta aleatória
        if (!server) {
            logger.info('Tentando porta alternativa...');
            server = await startServerOnPort(0);
            
            if (!server) {
                throw new Error('Não foi possível iniciar o servidor em nenhuma porta');
            }
        }

    } catch (error) {
        logger.error('Erro ao iniciar servidor', { 
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

startServer();
