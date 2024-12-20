const { handleResponse, handleError } = require('../../utils/responseHandler');
const { logger } = require('../../middlewares/logger');
const IBoletoService = require('./interfaces/IBoletoService');
const { BoletoCreateDTO, BoletoUpdateDTO } = require('./dto/boleto.dto');

class BoletoController {
    /**
     * @param {IBoletoService} boletoService Serviço de boletos
     */
    constructor(boletoService) {
        this.boletoService = boletoService;
    }

    /**
     * Lista boletos
     */
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = req.query;

            logger.info('Listando boletos', { filters });
            const result = await this.boletoService.listBoletos(page, limit, filters);
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro ao listar boletos', { 
                error: error.message,
                stack: error.stack
            });
            handleError(res, error);
        }
    }

    /**
     * Busca boleto por ID
     */
    async show(req, res) {
        try {
            const boletoId = parseInt(req.params.id);
            
            logger.info('Buscando boleto por ID', { boletoId });
            const boleto = await this.boletoService.getBoletoById(boletoId);
            
            handleResponse(res, 200, boleto);
        } catch (error) {
            logger.error('Erro ao buscar boleto', { 
                error: error.message,
                boletoId: req.params.id
            });
            handleError(res, error);
        }
    }

    /**
     * Cria novo boleto
     */
    async store(req, res) {
        try {
            const boletoDTO = new BoletoCreateDTO(req.body);
            boletoDTO.validate();

            logger.info('Criando boleto', { boletoData: req.body });
            const newBoleto = await this.boletoService.createBoleto(boletoDTO);
            
            handleResponse(res, 201, newBoleto);
        } catch (error) {
            logger.error('Erro ao criar boleto', { 
                error: error.message,
                boletoData: req.body
            });
            handleError(res, error);
        }
    }

    /**
     * Atualiza boleto
     */
    async update(req, res) {
        try {
            const boletoId = parseInt(req.params.id);
            const boletoDTO = new BoletoUpdateDTO(req.body);
            boletoDTO.validate();

            logger.info('Atualizando boleto', { 
                boletoId,
                boletoData: req.body
            });
            const updatedBoleto = await this.boletoService.updateBoleto(boletoId, boletoDTO);
            
            handleResponse(res, 200, updatedBoleto);
        } catch (error) {
            logger.error('Erro ao atualizar boleto', { 
                error: error.message,
                boletoId: req.params.id,
                boletoData: req.body
            });
            handleError(res, error);
        }
    }

    /**
     * Cancela boleto
     */
    async cancel(req, res) {
        try {
            const boletoId = parseInt(req.params.id);
            
            logger.info('Cancelando boleto', { 
                boletoId,
                reason: req.body.reason
            });
            const canceledBoleto = await this.boletoService.cancelBoleto(boletoId, req.body.reason);
            
            handleResponse(res, 200, canceledBoleto);
        } catch (error) {
            logger.error('Erro ao cancelar boleto', { 
                error: error.message,
                boletoId: req.params.id
            });
            handleError(res, error);
        }
    }
}

module.exports = BoletoController;
