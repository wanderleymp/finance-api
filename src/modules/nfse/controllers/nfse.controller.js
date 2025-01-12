const NFSeService = require('../services/nfse.service');
const { logger } = require('../../../middlewares/logger');
const EmissaoNfseService = require('../services/emissao-nfse.service');

class NFSeController {
  constructor(deps = {}) {
    this.nfseService = deps.nfseService || new NFSeService();
    this.emissaoNfseService = new EmissaoNfseService();
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

  async criarNfseParaMovimento(req, res) {
    try {
      const { id } = req.params;

      // Emite NFSe para o movimento
      const nfse = await this.emissaoNfseService.emitirNfseParaMovimento(id);

      // Resposta de sucesso
      res.status(201).json({
        message: 'NFSe emitida com sucesso',
        nfse
      });
    } catch (error) {
      // Log do erro
      logger.error('Erro ao criar NFSe para movimento', {
        movementId: req.params.id,
        error: error.message
      });

      // Resposta de erro
      res.status(error.response?.status || 500).json({
        message: 'Erro ao emitir NFSe',
        error: error.message
      });
    }
  }
}

module.exports = NFSeController;
