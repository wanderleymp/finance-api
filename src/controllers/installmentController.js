const installmentService = require('../services/installmentService');
const { logger } = require('../middlewares/logger');

console.log('Controller de installments carregado!');

class InstallmentController {
  async listInstallments(req, res) {
    try {
      const { 
        page, 
        limit,
        status, 
        payment_id, 
        start_date, 
        end_date 
      } = req.query;

      console.log('Dados da requisição:', { 
        page, 
        limit,
        status, 
        payment_id, 
        start_date, 
        end_date 
      });

      const filters = {
        status, 
        payment_id, 
        start_date, 
        end_date
      };

      const result = await installmentService.listInstallments(
        page ? parseInt(page) : undefined, 
        limit ? parseInt(limit) : undefined, 
        filters
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Erro no controller de listagem de installments', { 
        query: req.query, 
        error: error.message 
      });
      
      const statusCode = error.status || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Erro interno do servidor' 
      });
    }
  }

  async getInstallmentById(req, res) {
    try {
      const { installmentId } = req.params;
      
      if (!installmentId || isNaN(parseInt(installmentId))) {
        return res.status(400).json({ message: 'ID de installment inválido' });
      }

      const installment = await installmentService.getInstallmentById(parseInt(installmentId));
      
      res.json(installment);
    } catch (error) {
      logger.error('Erro no controller de busca de installment', { 
        params: req.params, 
        error: error.message 
      });
      
      const statusCode = error.status || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Erro interno do servidor' 
      });
    }
  }

  async createInstallment(req, res) {
    try {
      console.log('Received installment creation request:', req.body);
      const newInstallment = await installmentService.createInstallment(req.body);
      console.log('Installment created successfully:', newInstallment);
      res.status(201).json(newInstallment);
    } catch (error) {
      logger.error('Erro no controller de criação de installment', { 
        body: req.body, 
        error: error.message 
      });
      
      const statusCode = error.status || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Erro interno do servidor' 
      });
    }
  }

  async updateInstallment(req, res) {
    try {
      const { installmentId } = req.params;
      const installmentData = req.body;
      
      if (!installmentId || isNaN(parseInt(installmentId))) {
        return res.status(400).json({ message: 'ID de installment inválido' });
      }
      
      const updatedInstallment = await installmentService.updateInstallment(
        parseInt(installmentId), 
        installmentData
      );
      
      res.json(updatedInstallment);
    } catch (error) {
      logger.error('Erro no controller de atualização de installment', { 
        params: req.params, 
        body: req.body,
        error: error.message 
      });
      
      const statusCode = error.status || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Erro interno do servidor' 
      });
    }
  }

  async deleteInstallment(req, res) {
    try {
      const { installmentId } = req.params;
      
      if (!installmentId || isNaN(parseInt(installmentId))) {
        return res.status(400).json({ message: 'ID de installment inválido' });
      }
      
      await installmentService.deleteInstallment(parseInt(installmentId));
      
      res.status(204).send(); // No content
    } catch (error) {
      logger.error('Erro no controller de exclusão de installment', { 
        params: req.params, 
        error: error.message 
      });
      
      const statusCode = error.status || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = new InstallmentController();
