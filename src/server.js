require('dotenv').config();
const app = require('./app');
const { logger } = require('./middlewares/logger');
const { connectToDatabase } = require('./config/database');

const startServer = async () => {
    try {
        // Testar conexão com o banco
        await connectToDatabase();

        // Iniciar servidor
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            logger.info('🚀 Servidor inicializado na porta ' + PORT, { 
                port: PORT,
                environment: process.env.NODE_ENV 
            });
        });
    } catch (error) {
        logger.error('Erro ao iniciar servidor', { error });
        process.exit(1);
    }
}

startServer();
