const InvoiceService = require('./invoice.service');
const { validationResult } = require('express-validator');

class InvoiceController {
  async create(req, res) {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoice = await InvoiceService.create(req.body);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error creating invoice', 
        error: error.message 
      });
    }
  }

  async findAll(req, res) {
    try {
      const invoices = await InvoiceService.findAll(req.query);
      res.status(200).json(invoices);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error retrieving invoices', 
        error: error.message 
      });
    }
  }

  async findById(req, res) {
    try {
      const invoice = await InvoiceService.findById(req.params.id);
      res.status(200).json(invoice);
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ 
        message: 'Error retrieving invoice', 
        error: error.message 
      });
    }
  }

  async update(req, res) {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoice = await InvoiceService.update(req.params.id, req.body);
      res.status(200).json(invoice);
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ 
        message: 'Error updating invoice', 
        error: error.message 
      });
    }
  }

  async delete(req, res) {
    try {
      const result = await InvoiceService.delete(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ 
        message: 'Error deleting invoice', 
        error: error.message 
      });
    }
  }
}

module.exports = new InvoiceController();
