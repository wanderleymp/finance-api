const ChannelService = require('./channel.service');
const { logger } = require('../../middlewares/logger');

class ChannelController {
    constructor() {
        this.channelService = new ChannelService();
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            
            const result = await this.channelService.findAll(
                parseInt(page), 
                parseInt(limit), 
                filters
            );

            res.status(200).json(result);
        } catch (error) {
            logger.error('Erro no controlador ao buscar canais', { 
                error: error.message,
                query: req.query 
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno do servidor',
                code: error.code || 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    async findById(req, res) {
        try {
            const { id } = req.params;
            
            const channel = await this.channelService.findById(id);
            
            res.status(200).json(channel);
        } catch (error) {
            logger.error('Erro no controlador ao buscar canal por ID', { 
                error: error.message,
                channelId: req.params.id 
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno do servidor',
                code: error.code || 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    async create(req, res) {
        try {
            const channelData = req.body;
            
            const newChannel = await this.channelService.create(channelData);
            
            res.status(201).json(newChannel);
        } catch (error) {
            logger.error('Erro no controlador ao criar canal', { 
                error: error.message,
                data: req.body 
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno do servidor',
                code: error.code || 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const channelData = req.body;
            
            const updatedChannel = await this.channelService.update(id, channelData);
            
            res.status(200).json(updatedChannel);
        } catch (error) {
            logger.error('Erro no controlador ao atualizar canal', { 
                error: error.message,
                channelId: req.params.id,
                data: req.body 
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno do servidor',
                code: error.code || 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            
            const result = await this.channelService.delete(id);
            
            res.status(200).json(result);
        } catch (error) {
            logger.error('Erro no controlador ao excluir canal', { 
                error: error.message,
                channelId: req.params.id 
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno do servidor',
                code: error.code || 'INTERNAL_SERVER_ERROR'
            });
        }
    }
}

module.exports = ChannelController;
