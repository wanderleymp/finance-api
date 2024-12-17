const PaymentMethodsService = require('../services/paymentMethodsService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class PaymentMethodsController {
  async create(req, res) {
    try {
      logger.info('Criando novo método de pagamento', { 
        data: req.body 
      });

      const newPaymentMethod = await PaymentMethodsService.create(req.body);
      
      logger.info('Método de pagamento criado com sucesso', { 
        paymentMethodId: newPaymentMethod.payment_method_id 
      });

      handleResponse(res, 201, newPaymentMethod);
    } catch (error) {
      logger.error('Erro ao criar método de pagamento', {
        errorMessage: error.message,
        errorStack: error.stack,
        data: req.body
      });
      handleError(res, error);
    }
  }

  async list(req, res) {
    try {
      logger.info('Iniciando listagem de métodos de pagamento', {
        query: req.query
      });
      
      const { page, limit, ...filters } = req.query;
      const result = await PaymentMethodsService.list(page, limit, filters);
      
      logger.info('Listagem de métodos de pagamento concluída', { 
        count: result.data.length,
        currentPage: result.meta.current_page,
        totalRecords: result.meta.total,
        filters: filters
      });
      
      handleResponse(res, 200, result);
    } catch (error) {
      logger.error('Erro na listagem de métodos de pagamento', {
        errorMessage: error.message,
        errorStack: error.stack
      });
      handleError(res, error);
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      
      logger.info('Buscando método de pagamento por ID', { id });
      
      const paymentMethod = await PaymentMethodsService.getById(id);
      
      handleResponse(res, 200, paymentMethod);
    } catch (error) {
      logger.error('Erro ao buscar método de pagamento', {
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

      logger.info('Atualizando método de pagamento', { 
        paymentMethodId: id,
        updateData 
      });

      const updatedPaymentMethod = await PaymentMethodsService.update(id, updateData);
      
      logger.info('Método de pagamento atualizado com sucesso', { 
        paymentMethodId: id 
      });

      handleResponse(res, 200, updatedPaymentMethod);
    } catch (error) {
      logger.error('Erro ao atualizar método de pagamento', {
        errorMessage: error.message,
        errorStack: error.stack,
        paymentMethodId: req.params.id,
        updateData: req.body
      });
      handleError(res, error);
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      logger.info('Excluindo método de pagamento', { paymentMethodId: id });

      await PaymentMethodsService.delete(id);
      
      logger.info('Método de pagamento excluído com sucesso', { paymentMethodId: id });

      handleResponse(res, 204);
    } catch (error) {
      logger.error('Erro ao excluir método de pagamento', {
        errorMessage: error.message,
        errorStack: error.stack,
        paymentMethodId: req.params.id
      });
      handleError(res, error);
    }
  }
}

module.exports = new PaymentMethodsController();
