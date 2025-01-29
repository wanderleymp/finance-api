const ContractAdjustmentContractRoutes = require('./contract-adjustment-contract.routes');
const { logger } = require('../../middlewares/logger');

function contractAdjustmentContractRoutes(app) {
    try {
        logger.info('Registrando rotas de ajustes de contratos');
        app.use('/contract-adjustment-contracts', ContractAdjustmentContractRoutes);
        logger.info('Rotas de ajustes de contratos registradas com sucesso');
    } catch (error) {
        logger.error('Erro ao registrar rotas de ajustes de contratos', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

module.exports = contractAdjustmentContractRoutes;
