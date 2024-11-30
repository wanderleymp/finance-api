const logger = require('../../config/logger');
const PrismaLicenseRepository = require('../repositories/implementations/PrismaLicenseRepository');

const licenseRepository = new PrismaLicenseRepository();

// Create a new license
exports.createLicense = async (req, res) => {
    try {
        const license = await licenseRepository.createLicense(req.body);
        res.status(201).json(license);
    } catch (error) {
        if (error.message === 'Person not found') {
            return res.status(404).json({ error: 'Person not found' });
        }
        if (error.message === 'Person already has a license') {
            return res.status(400).json({ error: 'Person already has a license' });
        }
        logger.error('Error creating license:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all licenses with pagination
exports.getLicenses = async (req, res) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Remover campos vazios dos filtros
        Object.keys(filters).forEach(key => {
            if (filters[key] === '' || filters[key] === undefined) {
                delete filters[key];
            }
        });

        const result = await licenseRepository.getAllLicenses(filters, skip, parseInt(limit));
        res.json(result);
    } catch (error) {
        logger.error('Error fetching licenses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get license by ID
exports.getLicenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const license = await licenseRepository.getLicenseById(id);

        if (!license) {
            return res.status(404).json({ error: 'License not found' });
        }

        res.json(license);
    } catch (error) {
        logger.error(`Error fetching license ${req.params.id}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update license
exports.updateLicense = async (req, res) => {
    try {
        const { id } = req.params;
        const license = await licenseRepository.updateLicense(id, req.body);
        
        if (!license) {
            return res.status(404).json({ error: 'License not found' });
        }
        
        res.json(license);
    } catch (error) {
        logger.error(`Error updating license ${req.params.id}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete license
exports.deleteLicense = async (req, res) => {
    try {
        const { id } = req.params;
        await licenseRepository.deleteLicense(id);
        logger.info('License deleted successfully', { license_id: id });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'License not found' });
        }
        logger.error('Error deleting license:', error);
        res.status(500).json({ error: 'Error deleting license' });
    }
};
