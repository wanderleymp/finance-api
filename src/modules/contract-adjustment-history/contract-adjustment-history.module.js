const ContractAdjustmentHistoryRoutes = require('./contract-adjustment-history.routes');
const { logger } = require('../../middlewares/logger');

function contractAdjustmentHistoryRoutes(app) {
    try {
        logger.info('Registrando rotas de histórico de ajuste de contrato');
        app.use('/contract-adjustment-history', ContractAdjustmentHistoryRoutes);
        logger.info('Rotas de histórico de ajuste de contrato registradas com sucesso');
    } catch (error) {
        logger.error('Erro ao registrar rotas de histórico de ajuste de contrato', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

module.exports = contractAdjustmentHistoryRoutes;
