const installmentRepository = require('../repositories/installmentRepository');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const BoletoService = require('./boletoService');
const PaymentMethodsRepository = require('../repositories/paymentMethodsRepository');

class InstallmentService {
  async listInstallments(page = 1, limit = 10, filters = {}) {
    try {
      const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
      
      // Preparar filtros dinâmicos
      const dynamicFilters = {};
      
      if (filters.status) {
        dynamicFilters.status = filters.status;
      }
      
      if (filters.payment_id) {
        dynamicFilters.payment_id = filters.payment_id;
      }
      
      if (filters.start_date) {
        dynamicFilters.start_date = filters.start_date;
      }
      
      if (filters.end_date) {
        dynamicFilters.end_date = filters.end_date;
      }
      
      const installments = await installmentRepository.findAll(validPage, validLimit, dynamicFilters);
      
      logger.info('Serviço: Listagem de installments', {
        totalInstallments: installments.total,
        page: validPage,
        limit: validLimit,
        filters: dynamicFilters
      });

      return PaginationHelper.formatResponse(
        installments.data, 
        installments.total, 
        validPage, 
        validLimit
      );
    } catch (error) {
      logger.error('Erro no serviço ao listar installments', {
        errorMessage: error.message,
        filters
      });
      throw error;
    }
  }

  async getInstallmentById(installmentId) {
    try {
      const installment = await installmentRepository.findById(installmentId);
      
      if (!installment) {
        throw new ValidationError('Installment não encontrado');
      }
      
      return installment;
    } catch (error) {
      logger.error('Erro no serviço ao buscar installment', {
        errorMessage: error.message,
        installmentId
      });
      throw error;
    }
  }

  async createInstallment(installmentData) {
    try {
      // Validações de negócio
      logger.info('Attempting to create installment with data:', installmentData);
      
      // Validate required fields
      const requiredFields = ['payment_id', 'installment_number', 'due_date', 'amount', 'balance', 'status', 'expected_date'];
      const missingFields = requiredFields.filter(field => !installmentData[field]);
      
      if (missingFields.length > 0) {
        logger.error('Missing required fields:', missingFields);
        throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Criar installment
      const newInstallment = await installmentRepository.createInstallment(installmentData);
      
      // Criar boleto após criar a installment
      const boletoService = new BoletoService();
      const boletoData = {
        installment_id: newInstallment.installment_id,
        boleto_number: `${installmentData.payment_id}-${installmentData.installment_number}`,
        amount: installmentData.amount,
        due_date: installmentData.due_date
      };

      await boletoService.createBoleto(boletoData);

      logger.info('Installment criada com boleto', {
        installmentId: newInstallment.installment_id
      });

      return newInstallment;
    } catch (error) {
      logger.error('Erro ao criar installment com boleto', {
        installmentData,
        errorMessage: error.message,
        errorStack: error.stack
      });
      throw error;
    }
  }

  async updateInstallment(installmentId, installmentData) {
    try {
      this.validateInstallmentData(installmentData, false);
      return await installmentRepository.updateInstallment(installmentId, installmentData);
    } catch (error) {
      logger.error('Erro no serviço de atualização de installment', { 
        installmentId, 
        installmentData, 
        error: error.message 
      });
      throw error;
    }
  }

  async deleteInstallment(installmentId) {
    try {
      return await installmentRepository.deleteInstallment(installmentId);
    } catch (error) {
      logger.error('Erro no serviço de deleção de installment', { 
        installmentId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Validações e regras de negócio podem ser adicionadas aqui
  validateInstallmentFilters(filters) {
    const validStatuses = ['PENDING', 'PAID', 'OVERDUE'];
    
    if (filters.status && !validStatuses.includes(filters.status)) {
      throw new Error('Status inválido');
    }

    if (filters.startDate && isNaN(Date.parse(filters.startDate))) {
      throw new Error('Data inicial inválida');
    }

    if (filters.endDate && isNaN(Date.parse(filters.endDate))) {
      throw new Error('Data final inválida');
    }
  }

  validateInstallmentData(data, isCreate = false) {
    const requiredFields = [
      'payment_id', 
      'installment_number', 
      'due_date', 
      'amount', 
      'balance', 
      'account_entry_id'
    ];

    // Verificar campos obrigatórios apenas na criação
    if (isCreate) {
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          throw new Error(`Campo obrigatório ausente: ${field}`);
        }
      }
    }

    // Validações comuns
    if (data.payment_id && isNaN(data.payment_id)) {
      throw new Error('payment_id inválido');
    }

    if (data.due_date && isNaN(Date.parse(data.due_date))) {
      throw new Error('Data de vencimento inválida');
    }

    if (data.amount && (isNaN(data.amount) || data.amount < 0)) {
      throw new Error('Valor inválido');
    }

    if (data.balance && (isNaN(data.balance) || data.balance < 0)) {
      throw new Error('Saldo inválido');
    }

    if (data.account_entry_id && isNaN(data.account_entry_id)) {
      throw new Error('account_entry_id inválido');
    }
  }
}

module.exports = InstallmentService;
