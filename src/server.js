require('dotenv').config();
const app = require('./app');
const { logger } = require('./middlewares/logger');
const { systemDatabase } = require('./config/database');

async function startServer() {
    try {
        // Testar conexão com banco
        await systemDatabase.testConnection();

        // Iniciar servidor
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            logger.info(`Servidor rodando na porta ${port}`);
        });
    } catch (error) {
        logger.error('Erro ao iniciar servidor', {
            error: error.message
        });
        process.exit(1);
    }
}

startServer();
