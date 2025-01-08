const express = require('express');
const invoiceRoutes = require('./invoice.routes');
const logger = require('../../config/logger');

class InvoiceModule {
  constructor() {
    this.routes = invoiceRoutes;
  }

  register(app) {
    try {
      app.use('/invoices', this.routes);
      
      logger.info('Módulo de invoices registrado com sucesso', {
        routes: [
          'GET /invoices',
          'GET /invoices/:id', 
          'POST /invoices', 
          'PUT /invoices/:id', 
          'DELETE /invoices/:id'
        ]
      });
    } catch (error) {
      logger.error('Erro ao registrar módulo de invoices', { error: error.message });
      throw error;
    }
  }
}

module.exports = new InvoiceModule();
