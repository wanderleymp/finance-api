const MovementPaymentsService = require('../services/movementPaymentsService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');
const InstallmentService = require('../services/installmentService');

class MovementPaymentsController {
  async create(req, res) {
    try {
      logger.info('Criando novo movement payment', { 
        data: req.body 
      });

      const newMovementPayment = await MovementPaymentsService.create(req.body);
      
      logger.info('Movement Payment criado com sucesso', { 
        paymentId: newMovementPayment.payment_id 
      });

      handleResponse(res, 201, newMovementPayment);
    } catch (error) {
      logger.error('Erro ao criar movement payment', {
        errorMessage: error.message,
        errorStack: error.stack,
        data: req.body
      });
      handleError(res, error);
    }
  }

  async list(req, res) {
    try {
      logger.info('Iniciando listagem de movement payments', {
        query: req.query
      });
      
      const { page, limit, ...filters } = req.query;
      const result = await MovementPaymentsService.list(page, limit, filters);
      
      logger.info('Listagem de movement payments concluída', { 
        count: result.data.length,
        currentPage: result.meta.current_page,
        totalRecords: result.meta.total,
        filters: filters
      });
      
      handleResponse(res, 200, result);
    } catch (error) {
      logger.error('Erro na listagem de movement payments', {
        errorMessage: error.message,
        errorStack: error.stack
      });
      handleError(res, error);
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      
      logger.info('Buscando movement payment por ID', { id });
      
      const movementPayment = await MovementPaymentsService.getById(id);
      
      handleResponse(res, 200, movementPayment);
    } catch (error) {
      logger.error('Erro ao buscar movement payment', {
        errorMessage: error.message,
        errorStack: error.stack,
        id: req.params.id
      });
      handleError(res, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.info('Atualizando movement payment', { 
        paymentId: id,
        updateData 
      });

      const updatedMovementPayment = await MovementPaymentsService.update(id, updateData);
      
      logger.info('Movement Payment atualizado com sucesso', { 
        paymentId: id 
      });

      handleResponse(res, 200, updatedMovementPayment);
    } catch (error) {
      logger.error('Erro ao atualizar movement payment', {
        errorMessage: error.message,
        errorStack: error.stack,
        paymentId: req.params.id,
        updateData: req.body
      });
      handleError(res, error);
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      logger.info('Excluindo movement payment', { paymentId: id });

      await MovementPaymentsService.delete(id);
      
      logger.info('Movement Payment excluído com sucesso', { paymentId: id });

      handleResponse(res, 204);
    } catch (error) {
      logger.error('Erro ao excluir movement payment', {
        errorMessage: error.message,
        errorStack: error.stack,
        paymentId: req.params.id
      });
      handleError(res, error);
    }
  }

  async getInstallments(req, res) {
    try {
      const { id } = req.params;
      const { page, limit, ...filters } = req.query;
      
      logger.info('Buscando installments de movement payment', { 
        paymentId: id,
        page,
        limit,
        filters
      });
      
      const installmentService = new InstallmentService();
      
      const result = await installmentService.listInstallments(page, limit, {
        ...filters,
        payment_id: id
      });
      
      logger.info('Installments de movement payment encontrados', { 
        paymentId: id,
        count: result.data.length 
      });
      
      handleResponse(res, 200, result);
    } catch (error) {
      logger.error('Erro ao buscar installments de movement payment', {
        errorMessage: error.message,
        errorStack: error.stack,
        paymentId: req.params.id
      });
      handleError(res, error);
    }
  }
}

module.exports = new MovementPaymentsController();
