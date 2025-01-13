const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');

class LicenseController {
    constructor(service) {
        this.service = service;
    }

    async index(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            
            logger.info('Listando licenças', { page, limit, filters });
            
            const result = await this.service.listLicenses(page, limit, filters);
            
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao listar licenças', { 
                error: error.message, 
                stack: error.stack 
            });
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ 
                error: 'Erro interno ao listar licenças',
                details: error.message 
            });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Buscando licença por ID', { id });
            
            const license = await this.service.getLicense(id);
            
            return res.json(license);
        } catch (error) {
            logger.error('Erro ao buscar licença', { 
                id: req.params.id,
                error: error.message, 
                stack: error.stack 
            });
            
            if (error.statusCode === 404) {
                return res.status(404).json({ error: error.message });
            }
            
            return res.status(500).json({ 
                error: 'Erro interno ao buscar licença',
                details: error.message 
            });
        }
    }

    async create(req, res) {
        try {
            const licenseData = req.body;
            
            logger.info('Criando nova licença', { licenseData });
            
            const newLicense = await this.service.createLicense(licenseData);
            
            return res.status(201).json(newLicense);
        } catch (error) {
            logger.error('Erro ao criar licença', { 
                error: error.message, 
                stack: error.stack,
                licenseData: req.body 
            });
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ 
                    error: error.message,
                    details: error.details 
                });
            }
            
            return res.status(500).json({ 
                error: 'Erro interno ao criar licença',
                details: error.message 
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const licenseData = req.body;
            
            logger.info('Atualizando licença', { id, licenseData });
            
            const updatedLicense = await this.service.updateLicense(id, licenseData);
            
            return res.json(updatedLicense);
        } catch (error) {
            logger.error('Erro ao atualizar licença', { 
                id: req.params.id,
                error: error.message, 
                stack: error.stack,
                licenseData: req.body 
            });
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ 
                    error: error.message,
                    details: error.details 
                });
            }
            
            return res.status(500).json({ 
                error: 'Erro interno ao atualizar licença',
                details: error.message 
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Excluindo licença', { id });
            
            await this.service.deleteLicense(id);
            
            return res.status(204).send();
        } catch (error) {
            logger.error('Erro ao excluir licença', { 
                id: req.params.id,
                error: error.message, 
                stack: error.stack 
            });
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ 
                error: 'Erro interno ao excluir licença',
                details: error.message 
            });
        }
    }
}

module.exports = LicenseController;
