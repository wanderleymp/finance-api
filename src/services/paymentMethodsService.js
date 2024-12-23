const PaymentMethodsRepository = require('../repositories/paymentMethodsRepository');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const { handleDatabaseError } = require('../utils/errorHandler');
const { systemDatabase } = require('../config/database');

class PaymentMethodsService {
  constructor() {
  }

  async create(paymentMethodData) {
    try {
      // Validações de negócio
      if (!paymentMethodData.method_name) {
        throw new ValidationError('Nome do método de pagamento é obrigatório');
      }

      if (paymentMethodData.installment_count && paymentMethodData.installment_count < 1) {
        throw new ValidationError('Número de parcelas deve ser maior ou igual a 1');
      }

      const newPaymentMethod = await PaymentMethodsRepository.create(paymentMethodData);
      
      logger.info('Serviço: Método de pagamento criado', {
        paymentMethodId: newPaymentMethod.payment_method_id,
        methodName: newPaymentMethod.method_name
      });

      return newPaymentMethod;
    } catch (error) {
      logger.error('Erro no serviço ao criar método de pagamento', {
        errorMessage: error.message,
        paymentMethodData
      });
      throw handleDatabaseError(error);
    }
  }

  async list(page = 1, limit = 10, filters = {}) {
    try {
      const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
      
      // Preparar filtros dinâmicos
      const dynamicFilters = {};
      
      if (filters.method_name) {
        dynamicFilters.method_name = filters.method_name;
      }
      
      if (filters.active !== undefined) {
        dynamicFilters.active = filters.active === 'true';
      }
      
      const paymentMethods = await PaymentMethodsRepository.findAll(validPage, validLimit, dynamicFilters);
      
      logger.info('Serviço: Listagem de métodos de pagamento', {
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
      logger.error('Erro no serviço ao listar métodos de pagamento', {
        errorMessage: error.message,
        page,
        limit,
        filters
      });
      throw handleDatabaseError(error);
    }
  }

  async getById(paymentMethodId) {
    try {
      const paymentMethod = await PaymentMethodsRepository.findById(paymentMethodId);
      
      if (!paymentMethod) {
        throw new ValidationError('Método de pagamento não encontrado');
      }
      
      logger.info('Serviço: Detalhes do método de pagamento', {
        paymentMethodId
      });

      return { data: paymentMethod };
    } catch (error) {
      logger.error('Erro no serviço ao buscar método de pagamento', {
        errorMessage: error.message,
        paymentMethodId
      });
      throw handleDatabaseError(error);
    }
  }

  async findById(paymentMethodId) {
    try {
      if (!paymentMethodId) {
        throw new ValidationError('ID do método de pagamento é obrigatório');
      }

      const paymentMethod = await PaymentMethodsRepository.findById(paymentMethodId);
      
      if (!paymentMethod) {
        throw new ValidationError(`Método de pagamento com ID ${paymentMethodId} não encontrado`);
      }

      logger.info('Serviço: Método de pagamento encontrado', {
        paymentMethodId,
        methodName: paymentMethod.method_name
      });

      return { 
        data: paymentMethod 
      };
    } catch (error) {
      logger.error('Erro no serviço ao buscar método de pagamento por ID', {
        errorMessage: error.message,
        paymentMethodId
      });
      throw handleDatabaseError(error);
    }
  }

  async update(paymentMethodId, updateData) {
    try {
      // Validações de negócio
      if (updateData.installment_count && updateData.installment_count < 1) {
        throw new ValidationError('Número de parcelas deve ser maior ou igual a 1');
      }

      // Verificar se o método de pagamento existe antes de atualizar
      const existingPaymentMethod = await this.getById(paymentMethodId);

      const updatedPaymentMethod = await PaymentMethodsRepository.update(paymentMethodId, updateData);
      
      logger.info('Serviço: Método de pagamento atualizado', {
        paymentMethodId,
        updatedFields: Object.keys(updateData)
      });

      return updatedPaymentMethod;
    } catch (error) {
      logger.error('Erro no serviço ao atualizar método de pagamento', {
        errorMessage: error.message,
        paymentMethodId,
        updateData
      });
      throw handleDatabaseError(error);
    }
  }

  async delete(paymentMethodId) {
    try {
      // Verificar se o método de pagamento existe antes de deletar
      await this.getById(paymentMethodId);

      await PaymentMethodsRepository.delete(paymentMethodId);
      
      logger.info('Serviço: Método de pagamento excluído', {
        paymentMethodId
      });

      return true;
    } catch (error) {
      logger.error('Erro no serviço ao excluir método de pagamento', {
        errorMessage: error.message,
        paymentMethodId
      });
      throw handleDatabaseError(error);
    }
  }
}

module.exports = PaymentMethodsService;
