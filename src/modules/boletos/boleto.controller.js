const { logger } = require('../../middlewares/logger');
const { validateRequest } = require('../../middlewares/requestValidator');
const boletoSchema = require('./schemas/boleto.schema');

class BoletoController {
    constructor({ boletoService }) {
        this.boletoService = boletoService;
    }

    /**
     * Lista boletos
     */
    async index(req, res, next) {
        try {
            logger.info('Controller: Listando boletos', { filters: req.query });
            
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await this.boletoService.listBoletos(page, limit, filters);
            
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lista boletos com detalhes
     */
    async listWithDetails(req, res, next) {
        try {
            logger.info('Controller: Listando boletos com detalhes', { filters: req.query });
            
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await this.boletoService.listBoletosWithDetails(page, limit, filters);
            
            res.json(result);
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
            
            const boleto = await this.boletoService.getBoletoById(id);
            if (!boleto) {
                return res.status(404).json({ message: 'Boleto não encontrado' });
            }
            
            res.json(boleto);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Busca boleto por ID com detalhes
     */
    async showWithDetails(req, res, next) {
        try {
            const { id } = req.params;
            logger.info('Controller: Buscando boleto por ID com detalhes', { id });
            
            const boleto = await this.boletoService.getBoletoByIdWithDetails(id);
            if (!boleto) {
                return res.status(404).json({ message: 'Boleto não encontrado' });
            }
            
            res.json(boleto);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cria um novo boleto
     */
    async store(req, res, next) {
        try {
            logger.info('Controller: Criando boleto', { data: req.body });
            
            const boleto = await this.boletoService.createBoleto(req.body);
            res.status(201).json(boleto);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualiza um boleto existente
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            logger.info('Controller: Atualizando boleto', { id, data: req.body });
            
            const boleto = await this.boletoService.updateBoleto(id, req.body);
            if (!boleto) {
                return res.status(404).json({ message: 'Boleto não encontrado' });
            }
            
            res.json(boleto);
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
            
            const result = await this.boletoService.cancelBoleto(parseInt(id), data);
            
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cria boletos para um movimento
     */
    async createBoletosMovimento(req, res, next) {
        try {
            const { movimentoId } = req.params;
            logger.info('Controller: Criando boletos para movimento', { movimentoId });
            
            const boletos = await this.boletoService.emitirBoletosMovimento(parseInt(movimentoId));
            res.status(201).json(boletos);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BoletoController;
