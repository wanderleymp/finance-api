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
            logger.error('Erro no controller ao listar boletos', {
                error: error.message,
                stack: error.stack,
                errorName: error.name
            });

            return res.status(error.statusCode || 500).json({
                error: 'Erro ao listar boletos',
                message: error.message
            });
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
            logger.error('Erro no controller ao listar boletos com detalhes', {
                error: error.message,
                stack: error.stack,
                errorName: error.name
            });

            return res.status(error.statusCode || 500).json({
                error: 'Erro ao listar boletos com detalhes',
                message: error.message
            });
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
            logger.error('Erro no controller ao buscar boleto por ID', {
                error: error.message,
                stack: error.stack,
                errorName: error.name
            });

            return res.status(error.statusCode || 500).json({
                error: 'Erro ao buscar boleto por ID',
                message: error.message
            });
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
            logger.error('Erro no controller ao buscar boleto por ID com detalhes', {
                error: error.message,
                stack: error.stack,
                errorName: error.name
            });

            return res.status(error.statusCode || 500).json({
                error: 'Erro ao buscar boleto por ID com detalhes',
                message: error.message
            });
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
            logger.error('Erro no controller ao criar boleto', {
                error: error.message,
                stack: error.stack
            });

            return res.status(400).json({
                error: 'Erro ao criar boleto',
                message: error.message
            });
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
            logger.error('Erro no controller ao atualizar boleto', {
                error: error.message,
                stack: error.stack,
                errorName: error.name
            });

            return res.status(error.statusCode || 500).json({
                error: 'Erro ao atualizar boleto',
                message: error.message
            });
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
            logger.error('Erro no controller ao cancelar boleto', {
                error: error.message,
                stack: error.stack,
                errorName: error.name
            });

            return res.status(error.statusCode || 500).json({
                error: 'Erro ao cancelar boleto',
                message: error.message
            });
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
            logger.error('Erro no controller ao criar boletos para movimento', {
                error: error.message,
                stack: error.stack,
                errorName: error.name
            });

            return res.status(error.statusCode || 500).json({
                error: 'Erro ao criar boletos para movimento',
                message: error.message
            });
        }
    }
}

module.exports = BoletoController;
