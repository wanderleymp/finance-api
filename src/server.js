require('dotenv').config();
const app = require('./app');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { logger } = require('./middlewares/logger');
const { systemDatabase } = require('./config/database');
const socketService = require('./websocket/socket');

async function startServer() {
    try {
        // Testar conexão com banco
        await systemDatabase.testConnection();

        // Definir ambiente padrão se não estiver configurado
        process.env.NODE_ENV = process.env.NODE_ENV || 'development';

        const port = process.env.PORT || 3000;
        
        // Criar servidor HTTP para o Traefik
        const httpServer = http.createServer(app);
        
        // Inicializar WebSocket
        socketService.initialize(httpServer);
        
        httpServer.listen(port, () => {
            logger.info(`Servidor HTTP rodando na porta ${port} (${process.env.NODE_ENV})`);
        });

        // Em desenvolvimento, também criar servidor HTTPS
        if (process.env.NODE_ENV !== 'production') {
            const httpsPort = process.env.HTTPS_PORT || 3443;
            const certsPath = path.join(__dirname, '..', 'certs');
            const httpsOptions = {
                key: fs.readFileSync(path.join(certsPath, 'server.key')),
                cert: fs.readFileSync(path.join(certsPath, 'server.cert'))
            };

            const httpsServer = https.createServer(httpsOptions, app);
            
            // Inicializar WebSocket também para HTTPS
            socketService.initialize(httpsServer);
            
            httpsServer.listen(httpsPort, () => {
                logger.info(`Servidor HTTPS rodando na porta ${httpsPort} (${process.env.NODE_ENV})`, {
                    version: process.env.npm_package_version || 'unknown'
                });
            });
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
