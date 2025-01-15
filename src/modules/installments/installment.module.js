const InstallmentController = require('./installment.controller');
const InstallmentService = require('./installment.service');
const InstallmentRepository = require('./installment.repository');
const BoletoRepository = require('../boletos/boleto.repository');
const BoletoService = require('../boletos/boleto.service');
const installmentRoutes = require('./installment.routes');
const N8nService = require('../../services/n8n.service');

module.exports = (app) => {
    const repository = new InstallmentRepository();
    const boletoRepository = new BoletoRepository();
    const boletoService = new BoletoService({
        boletoRepository: boletoRepository,
        n8nService: N8nService
    });
    const service = new InstallmentService({ 
        installmentRepository: repository,
        boletoRepository: boletoRepository,
        boletoService: boletoService,
        n8nService: N8nService
    });
    const controller = new InstallmentController({ 
        installmentService: service 
    });

    return installmentRoutes(controller);
}
