const NFSeService = require('../services/nfse.service');
const { logger } = require('../../../middlewares/logger');

class NFSeController {
  constructor(deps = {}) {
    this.nfseService = deps.nfseService || new NFSeService();
  }

  async create(req, res) {
    try {
      const nfseData = req.body;
      const nfse = await this.nfseService.createNFSe(nfseData);
      res.status(201).json(nfse);
    } catch (error) {
      logger.error('Erro ao criar NFSe', { 
        error: error.message,
        body: req.body 
      });
      res.status(400).json({ 
        message: error.message 
      });
    }
  }

  async findOne(req, res) {
    try {
      const { id } = req.params;
      const nfse = await this.nfseService.findNFSe(id);
      res.json(nfse);
    } catch (error) {
      logger.error('Erro ao buscar NFSe', { 
        id: req.params.id,
        error: error.message 
      });
      res.status(404).json({ 
        message: error.message 
      });
    }
  }

  async list(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        ...filters 
      } = req.query;

      const nfses = await this.nfseService.listNFSes(
        Number(page), 
        Number(limit), 
        filters
      );
      
      res.json(nfses);
    } catch (error) {
      logger.error('Erro ao listar NFSes', { 
        error: error.message,
        filters: req.query 
      });
      res.status(400).json({ 
        message: error.message 
      });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, ...additionalData } = req.body;
      
      const nfse = await this.nfseService.updateNFSeStatus(
        id, 
        status, 
        additionalData
      );
      
      res.json(nfse);
    } catch (error) {
      logger.error('Erro ao atualizar status da NFSe', { 
        id: req.params.id,
        error: error.message 
      });
      res.status(400).json({ 
        message: error.message 
      });
    }
  }

  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      
      const nfse = await this.nfseService.cancelNFSe(id, motivo);
      
      res.json(nfse);
    } catch (error) {
      logger.error('Erro ao cancelar NFSe', { 
        id: req.params.id,
        error: error.message 
      });
      res.status(400).json({ 
        message: error.message 
      });
    }
  }

  /**
   * Consulta status de uma NFSe
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   */
  async consultarStatusNfse(req, res) {
    try {
      const { id } = req.params;
      logger.info('Consultando status da NFSe', {
        id,
        method: 'consultarStatusNfse',
        service: 'NFSeController'
      });

      const status = await this.nfseService.consultarStatusNfse(id);
      res.json(status);
    } catch (error) {
      logger.error('Erro ao consultar status da NFSe', {
        error: error.message,
        id: req.params.id,
        method: 'consultarStatusNfse',
        service: 'NFSeController'
      });
      res.status(400).json({
        error: 'Erro ao consultar status da NFSe'
      });
    }
  }

  /**
   * Lista todas as NFSes com status "processando"
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   */
  async listarNfsesProcessando(req, res) {
    try {
      logger.info('Listando NFSes com status processando', {
        method: 'listarNfsesProcessando',
        service: 'NFSeController'
      });

      const nfses = await this.nfseService.listarNfsesProcessando();
      res.json(nfses);
    } catch (error) {
      logger.error('Erro ao listar NFSes processando', {
        error: error.message,
        method: 'listarNfsesProcessando',
        service: 'NFSeController'
      });
      res.status(400).json({
        error: 'Erro ao listar NFSes processando'
      });
    }
  }

  /**
   * Atualiza o status de uma NFSe
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   */
  async atualizarStatusNfse(req, res) {
    try {
      const { id } = req.params;
      logger.info('Atualizando status da NFSe', {
        id,
        method: 'atualizarStatusNfse',
        service: 'NFSeController'
      });

      const nfse = await this.nfseService.atualizarStatusNfse(id);
      res.json(nfse);
    } catch (error) {
      logger.error('Erro ao atualizar status da NFSe', {
        error: error.message,
        id: req.params.id,
        method: 'atualizarStatusNfse',
        service: 'NFSeController'
      });
      res.status(400).json({
        error: 'Erro ao atualizar status da NFSe'
      });
    }
  }
}

module.exports = NFSeController;
