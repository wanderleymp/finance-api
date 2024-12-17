const MovementPaymentsRepository = require('../repositories/movementPaymentsRepository');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const { handleDatabaseError } = require('../utils/errorHandler');

class MovementPaymentsService {
  async create(paymentData) {
    try {
      // Validações de negócio
      if (!paymentData.movement_id) {
        throw new ValidationError('ID do movimento é obrigatório');
      }

      if (!paymentData.payment_method_id) {
        throw new ValidationError('ID do método de pagamento é obrigatório');
      }

      if (paymentData.total_amount <= 0) {
        throw new ValidationError('Valor do pagamento deve ser maior que zero');
      }

      const newPaymentMethod = await MovementPaymentsRepository.create(paymentData);
      
      logger.info('Serviço: Movement Payment criado', {
        paymentId: newPaymentMethod.payment_id,
        movementId: newPaymentMethod.movement_id
      });

      return newPaymentMethod;
    } catch (error) {
      logger.error('Erro no serviço ao criar movement payment', {
        errorMessage: error.message,
        paymentData
      });
      throw handleDatabaseError(error);
    }
  }

  async list(page = 1, limit = 10, filters = {}) {
    try {
      const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
      
      // Preparar filtros dinâmicos
      const dynamicFilters = {};
      
      if (filters.movement_id) {
        dynamicFilters.movement_id = filters.movement_id;
      }
      
      if (filters.payment_method_id) {
        dynamicFilters.payment_method_id = filters.payment_method_id;
      }
      
      if (filters.status) {
        dynamicFilters.status = filters.status;
      }
      
      const paymentMethods = await MovementPaymentsRepository.findAll(validPage, validLimit, dynamicFilters);
      
      logger.info('Serviço: Listagem de movement payments', {
        totalPaymentMethods: paymentMethods.total,
        page: validPage,
        limit: validLimit,
        filters: dynamicFilters
      });

      return PaginationHelper.formatResponse(
        paymentMethods.data, 
        paymentMethods.total, 
        validPage, 
        validLimit
      );
    } catch (error) {
      logger.error('Erro no serviço ao listar movement payments', {
        errorMessage: error.message,
        page,
        limit,
        filters
      });
      throw handleDatabaseError(error);
    }
  }

  async getById(paymentId) {
    try {
      const paymentMethod = await MovementPaymentsRepository.findById(paymentId);
      
      if (!paymentMethod) {
        throw new ValidationError('Movement Payment não encontrado');
      }
      
      logger.info('Serviço: Detalhes do movement payment', {
        paymentId
      });

      return { data: paymentMethod };
    } catch (error) {
      logger.error('Erro no serviço ao buscar movement payment', {
        errorMessage: error.message,
        paymentId
      });
      throw handleDatabaseError(error);
    }
  }

  async update(paymentId, updateData) {
    try {
      // Validações de negócio
      if (updateData.total_amount && updateData.total_amount <= 0) {
        throw new ValidationError('Valor do pagamento deve ser maior que zero');
      }

      // Verificar se o movement payment existe antes de atualizar
      await this.getById(paymentId);

      const updatedPaymentMethod = await MovementPaymentsRepository.update(paymentId, updateData);
      
      logger.info('Serviço: Movement Payment atualizado', {
        paymentId,
        updatedFields: Object.keys(updateData)
      });

      return updatedPaymentMethod;
    } catch (error) {
      logger.error('Erro no serviço ao atualizar movement payment', {
        errorMessage: error.message,
        paymentId,
        updateData
      });
      throw handleDatabaseError(error);
    }
  }

  async delete(paymentId) {
    try {
      // Verificar se o movement payment existe antes de deletar
      await this.getById(paymentId);

      await MovementPaymentsRepository.delete(paymentId);
      
      logger.info('Serviço: Movement Payment excluído', {
        paymentId
      });

      return true;
    } catch (error) {
      logger.error('Erro no serviço ao excluir movement payment', {
        errorMessage: error.message,
        paymentId
      });
      throw handleDatabaseError(error);
    }
  }
}

module.exports = new MovementPaymentsService();
