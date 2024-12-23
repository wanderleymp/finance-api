const { logger } = require('../../middlewares/logger');

class BoletoController {
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
                parseInt(page) || 1,
                parseInt(limit) || 10,
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
            
            const result = await this.service.getBoletoById(parseInt(id));
            
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cria um novo boleto
     */
    async store(req, res, next) {
        try {
            const data = req.body;
            
            logger.info('Controller: Criando boleto', { data });
            
            const result = await this.service.createBoleto(data);
            
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualiza um boleto
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            
            logger.info('Controller: Atualizando boleto', { id, data });
            
            const result = await this.service.updateBoleto(parseInt(id), data);
            
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancela um boleto
     */
    async cancel(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            
            logger.info('Controller: Cancelando boleto', { id, data });
            
            const result = await this.service.cancelBoleto(parseInt(id), data);
            
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BoletoController;
