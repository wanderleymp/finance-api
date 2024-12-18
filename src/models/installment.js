const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');

class Installment {
  constructor() {
    this.pool = systemDatabase.pool;
    this.logger = logger;
  }

  async listInstallments(filters = {}) {
    const { 
      page = 1, 
      pageSize = 10, 
      status, 
      paymentId, 
      startDate, 
      endDate 
    } = filters;

    const offset = (page - 1) * pageSize;

    let query = `
      SELECT 
        installment_id,
        payment_id,
        installment_number,
        due_date,
        amount,
        balance,
        status,
        account_entry_id,
        expected_date
      FROM public.installments
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (paymentId) {
      query += ` AND payment_id = $${paramIndex}`;
      queryParams.push(paymentId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND due_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND due_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY due_date LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSize, offset);

    try {
      const result = await this.pool.query(query, queryParams);
      
      // Contar total de registros para paginação
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM public.installments 
        WHERE 1=1 
        ${status ? `AND status = '${status}'` : ''}
        ${paymentId ? `AND payment_id = ${paymentId}` : ''}
        ${startDate ? `AND due_date >= '${startDate}'` : ''}
        ${endDate ? `AND due_date <= '${endDate}'` : ''}
      `;
      
      const countResult = await this.pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);

      return {
        installments: result.rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      this.logger.error('Erro ao listar installments', { error: error.message });
      throw error;
    }
  }

  async getInstallmentById(installmentId) {
    try {
      const query = `
        SELECT 
          installment_id,
          payment_id,
          installment_number,
          due_date,
          amount,
          balance,
          status,
          account_entry_id,
          expected_date
        FROM public.installments
        WHERE installment_id = $1
      `;

      const result = await this.pool.query(query, [installmentId]);
      
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Erro ao buscar installment por ID', { 
        installmentId, 
        error: error.message 
      });
      throw error;
    }
  }

  async createInstallment(installmentData) {
    const { 
      payment_id, 
      installment_number, 
      due_date, 
      amount, 
      balance, 
      account_entry_id 
    } = installmentData;

    const query = `
      INSERT INTO public.installments (
        payment_id, 
        installment_number, 
        due_date, 
        amount, 
        balance, 
        account_entry_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [
        payment_id, 
        installment_number, 
        due_date, 
        amount, 
        balance, 
        account_entry_id
      ]);

      return result.rows[0];
    } catch (error) {
      this.logger.error('Erro ao criar installment', { 
        installmentData, 
        error: error.message 
      });
      throw error;
    }
  }

  async updateInstallment(installmentId, installmentData) {
    const { 
      payment_id, 
      installment_number, 
      due_date, 
      amount, 
      balance, 
      account_entry_id 
    } = installmentData;

    const query = `
      UPDATE public.installments
      SET 
        payment_id = COALESCE($1, payment_id),
        installment_number = COALESCE($2, installment_number),
        due_date = COALESCE($3, due_date),
        amount = COALESCE($4, amount),
        balance = COALESCE($5, balance),
        account_entry_id = COALESCE($6, account_entry_id)
      WHERE installment_id = $7
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [
        payment_id, 
        installment_number, 
        due_date, 
        amount, 
        balance, 
        account_entry_id,
        installmentId
      ]);

      if (result.rows.length === 0) {
        const error = new Error('Installment não encontrado');
        error.status = 404;
        throw error;
      }

      return result.rows[0];
    } catch (error) {
      this.logger.error('Erro ao atualizar installment', { 
        installmentId, 
        installmentData, 
        error: error.message 
      });
      throw error;
    }
  }

  async deleteInstallment(installmentId) {
    const query = `
      DELETE FROM public.installments
      WHERE installment_id = $1
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [installmentId]);

      if (result.rows.length === 0) {
        const error = new Error('Installment não encontrado');
        error.status = 404;
        throw error;
      }

      return result.rows[0];
    } catch (error) {
      this.logger.error('Erro ao deletar installment', { 
        installmentId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new Installment();
