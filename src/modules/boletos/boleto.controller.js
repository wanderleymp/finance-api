const { logger } = require('../../middlewares/logger');
const IBoletoService = require('./interfaces/IBoletoService');

class BoletoController {
    /**
     * @param {Object} params
     * @param {IBoletoService} params.boletoService Serviço de boletos
     */
    constructor({ boletoService }) {
        this.service = boletoService;
    }

    /**
     * Lista boletos
     */
    async index(req, res, next) {
        try {
            const { page, limit, ...filters } = req.query;
            
            logger.info('Controller: Listando boletos', { 
                page, 
                limit, 
                filters 
            });

            const result = await this.service.listBoletos(
                parseInt(page), 
                parseInt(limit), 
                filters
            );

            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Busca boleto por ID
     */
    async show(req, res, next) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Buscando boleto por ID', { id });

            const boleto = await this.service.getBoletoById(parseInt(id));

            return res.json(boleto);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cria novo boleto
     */
    async store(req, res, next) {
        try {
            const boletoData = req.body;
            
            logger.info('Controller: Criando novo boleto', { boletoData });

            const boleto = await this.service.createBoleto(boletoData);

            return res.status(201).json(boleto);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualiza boleto
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const boletoData = req.body;
            
            logger.info('Controller: Atualizando boleto', { 
                id, 
                boletoData 
            });

            const boleto = await this.service.updateBoleto(parseInt(id), boletoData);

            return res.json(boleto);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Emite boletos para um movimento
     */
    async emitirBoletos(req, res, next) {
        try {
            const { movimentoId } = req.params;
            const { parcelas } = req.body;
            
            logger.info('Controller: Emitindo boletos para movimento', { 
                movimentoId, 
                parcelas 
            });

            const boletos = await this.service.emitirBoletosMovimento(
                parseInt(movimentoId), 
                parcelas
            );

            return res.status(201).json(boletos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancela boleto
     */
    async cancel(req, res, next) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;
            
            logger.info('Controller: Cancelando boleto', { 
                id, 
                motivo 
            });

            const boleto = await this.service.cancelBoleto(parseInt(id), motivo);

            return res.json(boleto);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BoletoController;
