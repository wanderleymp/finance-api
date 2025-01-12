const { logger } = require('../../middlewares/logger');

class NFSeController {
  constructor({ nfseService }) {
    this.nfseService = nfseService;
  }

  async create(req, res, next) {
    try {
      const nfseData = req.body;
      const nfse = await this.nfseService.createNFSe(nfseData);
      res.status(201).json(nfse);
    } catch (error) {
      logger.error('Erro ao criar NFSe', { 
        error: error.message,
        body: req.body 
      });
      next(error);
    }
  }

  async index(req, res, next) {
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
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const { id } = req.params;
      const nfse = await this.nfseService.findNFSe(id);
      res.json(nfse);
    } catch (error) {
      logger.error('Erro ao buscar NFSe', { 
        id: req.params.id,
        error: error.message 
      });
      next(error);
    }
  }

  async updateStatus(req, res, next) {
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
      next(error);
    }
  }

  async cancel(req, res, next) {
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
      next(error);
    }
  }

  async criarNfseParaMovimento(req, res, next) {
    try {
      const { id } = req.params;
      const nfse = await this.nfseService.emitirNfseParaMovimento(id);
      res.status(201).json(nfse);
    } catch (error) {
      logger.error('Erro ao criar NFSe para movimento', { 
        movementId: req.params.id,
        error: error.message 
      });
      next(error);
    }
  }
}

module.exports = NFSeController;
