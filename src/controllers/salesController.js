const SalesService = require('../services/salesService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class SalesController {
    constructor() {
        this.salesService = new SalesService();
    }

    async index(req, res) {
        try {
            logger.info('Iniciando listagem de vendas', {
                query: req.query
            });
            
            const { page, limit, ...filters } = req.query;
            const result = await this.salesService.list(filters, page, limit);
            
            logger.info('Listagem de vendas concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de vendas', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Buscando venda por ID', { id });
            
            const sale = await this.salesService.getById(id);
            
            handleResponse(res, 200, sale);
        } catch (error) {
            logger.error('Erro ao buscar venda', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id
            });
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            logger.info('Criando nova venda', { body: req.body });
            
            const newSale = await this.salesService.create(req.body);
            
            logger.info('Venda criada com sucesso', { 
                movementId: newSale.movement_id 
            });
            
            handleResponse(res, 201, newSale);
        } catch (error) {
            logger.error('Erro ao criar venda', {
                errorMessage: error.message,
                errorStack: error.stack,
                body: req.body
            });
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Atualizando venda', { id, body: req.body });
            
            const updatedSale = await this.salesService.update(id, req.body);
            
            logger.info('Venda atualizada com sucesso', { 
                movementId: updatedSale.movement_id 
            });
            
            handleResponse(res, 200, updatedSale);
        } catch (error) {
            logger.error('Erro ao atualizar venda', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id,
                body: req.body
            });
            handleError(res, error);
        }
    }

    async destroy(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Deletando venda', { id });
            
            const deletedSale = await this.salesService.delete(id);
            
            logger.info('Venda deletada com sucesso', { id });
            
            handleResponse(res, 200, deletedSale);
        } catch (error) {
            logger.error('Erro ao deletar venda', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id
            });
            handleError(res, error);
        }
    }
}

module.exports = SalesController;
