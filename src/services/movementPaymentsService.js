const MovementPaymentsRepository = require('../repositories/movementPaymentsRepository');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const { handleDatabaseError } = require('../utils/errorHandler');
const InstallmentService = require('../services/installmentService');
const PaymentMethodsRepository = require('../repositories/paymentMethodsRepository');

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
      
      // Buscar installments para cada payment
      const installmentService = new InstallmentService();
      
      const paymentsWithInstallments = await Promise.all(
        paymentMethods.data.map(async (payment) => {
          const installments = await installmentService.listInstallments(1, 100, { 
            payment_id: payment.payment_id 
          });
          
          return {
            ...payment,
            installments: installments.data
          };
        })
      );
      
      logger.info('Serviço: Listagem de movement payments', {
        totalPaymentMethods: paymentMethods.total,
        page: validPage,
        limit: validLimit,
        filters: dynamicFilters
      });

      return PaginationHelper.formatResponse(
        paymentsWithInstallments, 
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

  async getById(paymentId, page = 1, limit = 10, filters = {}) {
    try {
      const paymentMethod = await MovementPaymentsRepository.findById(paymentId);
      
      if (!paymentMethod) {
        throw new ValidationError('Movement Payment não encontrado');
      }
      
      // Buscar parcelas relacionadas ao payment
      const installmentService = new InstallmentService();
      
      const result = await installmentService.listInstallments(page, limit, { 
        ...filters,
        payment_id: paymentId 
      });
      
      logger.info('Serviço: Detalhes do movement payment', {
        paymentId,
        installmentsCount: result.data.length
      });

      return { 
        data: {
          ...paymentMethod,
          installments: result.data
        }
      };
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

  async createFromMovement(movement, client) {
    try {
      // 1. Validar método de pagamento
      const paymentMethod = await PaymentMethodsRepository.findById(movement.payment_method_id);
      
      if (!paymentMethod) {
        throw new ValidationError('Método de pagamento não encontrado');
      }

      // 2. Preparar dados de payment
      const movementPaymentData = {
        movement_id: movement.movement_id,
        payment_method_id: movement.payment_method_id,
        total_amount: movement.total_amount,
        status: 'Pendente'
      };

      // 3. Criar movement payment usando método create existente
      const movementPayment = await this.create(movementPaymentData);

      // 4. Gerar parcelas baseado no método de pagamento
      const installmentCount = paymentMethod.installment_count || 1;
      const daysBetweenInstallments = paymentMethod.days_between_installments || 30;
      const firstDueDateDays = paymentMethod.first_due_date_days || 30;

      const installmentAmount = movementPayment.total_amount / installmentCount;
      const installments = [];

      const installmentService = new InstallmentService();

      for (let i = 1; i <= installmentCount; i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + firstDueDateDays + (i - 1) * daysBetweenInstallments);

        const installmentData = {
          payment_id: movementPayment.payment_id,
          installment_number: i,
          due_date: dueDate,
          amount: installmentAmount,
          balance: installmentAmount,
          status: 'Pendente',
          expected_date: dueDate
        };

        // Criar installment (que também criará o boleto)
        const installment = await installmentService.createInstallment(installmentData);
        
        installments.push(installment);
      }

      logger.info('Movimento com pagamento processado com sucesso', {
        movementId: movement.movement_id,
        paymentId: movementPayment.payment_id,
        installmentsCount: installments.length
      });

      return movementPayment;
    } catch (error) {
      logger.error('Erro ao processar movimento com pagamento', {
        movement,
        errorMessage: error.message,
        errorStack: error.stack
      });
      throw error;
    }
  }
}

module.exports = MovementPaymentsService;
