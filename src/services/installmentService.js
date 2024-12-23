const { systemDatabase } = require('../config/database');
const installmentRepository = require('../repositories/installmentRepository');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const BoletoService = require('./boletoService');
const PaymentMethodsRepository = require('../repositories/paymentMethodsRepository');

class InstallmentService {
  constructor() {
    this.pool = systemDatabase.pool;
  }

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

  async create(data) {
    try {
      logger.info('Service: Criando installment', { data });

      // Criar installment
      const installment = await installmentRepository.create(data);
      logger.info('Service: Installment criado', { installment });

      // Buscar o movimento_payment para ver o tipo do movimento
      const query = `
        SELECT m.movement_type_id
        FROM movements m
        JOIN movement_payments mp ON mp.movement_id = m.movement_id
        WHERE mp.payment_id = $1
      `;

      const { rows } = await this.pool.query(query, [data.payment_id]);
      const movementType = rows[0]?.movement_type_id;

      logger.info('Service: Tipo do movimento encontrado', { movementType });

      // Se for tipo 1 ou 3, criar boleto
      if (movementType === 1 || movementType === 3) {
        const boleto = await BoletoService.create({
          installment_id: installment.installment_id,
          amount: data.amount,
          due_date: data.due_date,
          status: 'PENDING'
        });

        logger.info('Service: Boleto criado', { boleto });

        return {
          ...installment,
          boleto
        };
      }

      return installment;
    } catch (error) {
      logger.error('Service: Erro ao criar installment', {
        error: error.message,
        error_stack: error.stack,
        data
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

  /**
   * Busca o tipo do movimento associado a uma parcela
   */
  async getMovementTypeFromInstallment(installmentId) {
    try {
      const query = `
        SELECT m.movement_type_id
        FROM installments i
        JOIN movement_payments mp ON mp.payment_id = i.payment_id
        JOIN movements m ON m.movement_id = mp.movement_id
        WHERE i.installment_id = $1
      `;
      
      const result = await this.pool.query(query, [installmentId]);
      return result.rows[0]?.movement_type_id;
    } catch (error) {
      logger.error('Erro ao buscar tipo do movimento da parcela', {
        installmentId,
        error: error.message
      });
      return null;
    }
  }
}

module.exports = InstallmentService;
