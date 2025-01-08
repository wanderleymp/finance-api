const Invoice = require('./invoice.model');
const { Op } = require('sequelize');

class InvoiceService {
  async create(invoiceData) {
    try {
      return await Invoice.create(invoiceData);
    } catch (error) {
      throw new Error(`Error creating invoice: ${error.message}`);
    }
  }

  async findAll(query = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        type, 
        startDate, 
        endDate 
      } = query;

      const whereCondition = {};

      if (status) whereCondition.status = status;
      if (type) whereCondition.type = type;
      
      if (startDate && endDate) {
        whereCondition.created_at = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      return await Invoice.findAndCountAll({
        where: whereCondition,
        include: ['emitente', 'destinatario'],
        offset: (page - 1) * limit,
        limit: limit,
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Error finding invoices: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const invoice = await Invoice.findByPk(id, {
        include: ['emitente', 'destinatario']
      });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      return invoice;
    } catch (error) {
      throw new Error(`Error finding invoice: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      const [updatedCount, updatedInvoices] = await Invoice.update(updateData, {
        where: { invoice_id: id },
        returning: true
      });

      if (updatedCount === 0) {
        throw new Error('Invoice not found');
      }

      return updatedInvoices[0];
    } catch (error) {
      throw new Error(`Error updating invoice: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const deletedCount = await Invoice.destroy({
        where: { invoice_id: id }
      });

      if (deletedCount === 0) {
        throw new Error('Invoice not found');
      }

      return { message: 'Invoice deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting invoice: ${error.message}`);
    }
  }
}

module.exports = new InvoiceService();
