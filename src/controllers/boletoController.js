const PrismaBoletoRepository = require('../repositories/implementations/PrismaBoletoRepository');
const logger = require('../../config/logger');

const boletoRepository = new PrismaBoletoRepository();

exports.createBoleto = async (req, res) => {
    try {
        logger.info('Create Boleto Request', { body: req.body });
        const boleto = await boletoRepository.create(req.body);
        res.status(201).json(boleto);
    } catch (error) {
        logger.error('Error creating boleto', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};

exports.getBoletoById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('Get Boleto by ID', { id });
        const boleto = await boletoRepository.findById(parseInt(id));
        
        if (!boleto) {
            return res.status(404).json({ error: 'Boleto not found' });
        }
        
        res.json(boleto);
    } catch (error) {
        logger.error('Error getting boleto', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};

exports.getAllBoletos = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10,
            ...filters 
        } = req.query;

        logger.info('Get All Boletos Request', { query: req.query });

        const skip = (page - 1) * limit;
        const result = await boletoRepository.findAll(filters, skip, parseInt(limit));
        
        res.json(result);
    } catch (error) {
        logger.error('Error getting boletos', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};

exports.updateBoleto = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('Update Boleto Request', { id, body: req.body });
        
        const boleto = await boletoRepository.update(parseInt(id), req.body);
        res.json(boleto);
    } catch (error) {
        logger.error('Error updating boleto', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};

exports.deleteBoleto = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('Delete Boleto Request', { id });
        
        await boletoRepository.delete(parseInt(id));
        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting boleto', { error: error.message });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};
