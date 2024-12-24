const testRoutes = require('./test.routes');
const { logger } = require('../../middlewares/logger');

module.exports = (app) => {
    logger.info('Registrando módulo de mensagens');
    
    // Registra rotas de teste
    app.use('/messages/test', testRoutes());

    logger.info('Módulo de mensagens registrado com sucesso');
};
