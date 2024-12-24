require('dotenv').config();
const app = require('./app');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { logger } = require('./middlewares/logger');
const { systemDatabase } = require('./config/database');

async function startServer() {
    try {
        // Testar conexão com banco
        await systemDatabase.testConnection();

        const port = process.env.PORT || 3000;
        
        // Configurações HTTPS
        let httpsOptions;
        
        if (process.env.NODE_ENV === 'production') {
            httpsOptions = {
                key: fs.readFileSync('/etc/ssl/agilefinance/privkey.pem'),
                cert: fs.readFileSync('/etc/ssl/agilefinance/fullchain.pem')
            };
        } else {
            // Usar certificados de desenvolvimento
            const certsPath = path.join(__dirname, '..', 'certs');
            httpsOptions = {
                key: fs.readFileSync(path.join(certsPath, 'server.key')),
                cert: fs.readFileSync(path.join(certsPath, 'server.cert'))
            };
        }

        // Criar servidor HTTPS
        const httpsServer = https.createServer(httpsOptions, app);
        httpsServer.listen(port, () => {
            logger.info(`Servidor HTTPS rodando na porta ${port} (${process.env.NODE_ENV})`);
        });

    } catch (error) {
        logger.error('Erro ao iniciar servidor', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

startServer();
