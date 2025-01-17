const ContractRecurringRoutes = require('./contract-recurring.routes');
const { logger } = require('../../middlewares/logger');

function contractRecurringRoutes(app) {
    try {
        logger.info('Registrando rotas de contratos recorrentes');
        app.use('/contracts-recurring', ContractRecurringRoutes);
        logger.info('Rotas de contratos recorrentes registradas com sucesso');
    } catch (error) {
        logger.error('Erro ao registrar rotas de contratos recorrentes', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

module.exports = contractRecurringRoutes;
