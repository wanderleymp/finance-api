const logger = require('../../config/logger');
const PrismaServiceRepository = require('../repositories/implementations/PrismaServiceRepository');

const serviceRepository = new PrismaServiceRepository();

// Get all services
exports.getAllServices = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            name,
            description,
            status, 
            minPrice, 
            maxPrice, 
            serviceGroupId 
        } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Construir filtros
        const filters = {};

        // Filtros de busca
        const searchTerm = search || name || description;
        if (searchTerm) {
            filters.searchTerm = searchTerm;
        }

        // Filtro de status
        if (status) {
            filters.status = status;
        }

        // Filtro de preço
        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price.gte = parseFloat(minPrice);
            if (maxPrice) filters.price.lte = parseFloat(maxPrice);
        }

        // Filtro de grupo
        if (serviceGroupId) {
            filters.service_group_id = parseInt(serviceGroupId);
        }

        console.log('Filtros construídos:', filters);

        const result = await serviceRepository.getAllServices(filters, skip, parseInt(limit));
        res.json(result);
    } catch (error) {
        logger.error('Error in getAllServices:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await serviceRepository.getServiceById(id);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(service);
    } catch (error) {
        logger.error('Error in getServiceById:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};

// Create service
exports.createService = async (req, res) => {
    try {
        const service = await serviceRepository.createService(req.body);
        res.status(201).json(service);
    } catch (error) {
        if (error.message === 'Service code already exists') {
            return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('Missing required fields')) {
            return res.status(400).json({ error: error.message });
        }
        logger.error('Error in createService:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};

// Update service
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await serviceRepository.updateService(id, req.body);
        res.json(service);
    } catch (error) {
        if (error.message === 'Service not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Service code already exists') {
            return res.status(400).json({ error: error.message });
        }
        logger.error('Error in updateService:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};

// Delete service
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        await serviceRepository.deleteService(id);
        res.status(204).send();
    } catch (error) {
        if (error.message === 'Service not found') {
            return res.status(404).json({ error: error.message });
        }
        logger.error('Error in deleteService:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};
