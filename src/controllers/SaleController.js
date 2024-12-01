const MovementService = require('../services/MovementService');
const logger = require('../../config/logger');

class SaleController {
    async createSale(req, res) {
        try {
            const userId = req.user.id;
            const saleData = {
                ...req.body,
                movement_type_id: 1  // Tipo "Venda"
            };

            const sale = await MovementService.createMovement(saleData, userId);
            res.status(201).json(sale);
        } catch (error) {
            logger.error('Error in createSale:', error);
            if (error.message.includes('required')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getSaleById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            const sale = await MovementService.getMovementById(id, userId);
            
            // Verificar se é uma venda
            if (sale.movement_type_id !== 1) {
                return res.status(404).json({ error: 'Sale not found' });
            }

            res.json(sale);
        } catch (error) {
            logger.error('Error in getSaleById:', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Sale not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllSales(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'movement_date',
                sortOrder = 'desc',
                startDate,
                endDate,
                personId,
                minAmount,
                maxAmount,
                paymentMethodId,
                licenseId,
                ...otherFilters
            } = req.query;

            const userId = req.user.id;
            
            // Construir filtros
            const filters = {
                movement_type_id: 1, // Tipo "Venda"
                license_id: licenseId,
                ...otherFilters
            };

            // Adicionar filtros condicionais
            if (personId) filters.person_id = parseInt(personId);
            if (paymentMethodId) filters.payment_method_id = parseInt(paymentMethodId);
            
            // Filtros de data
            if (startDate || endDate) {
                filters.movement_date = {};
                if (startDate) filters.movement_date.gte = new Date(startDate);
                if (endDate) filters.movement_date.lte = new Date(endDate);
            }

            // Filtros de valor
            if (minAmount || maxAmount) {
                filters.total_amount = {};
                if (minAmount) filters.total_amount.gte = parseFloat(minAmount);
                if (maxAmount) filters.total_amount.lte = parseFloat(maxAmount);
            }

            // Configurar ordenação
            const sort = {
                field: sortBy,
                order: sortOrder.toLowerCase()
            };
            
            const result = await MovementService.getAllMovements(
                filters,
                parseInt(page),
                parseInt(limit),
                sort,
                userId
            );
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            logger.error('Error in getAllSales:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                message: error.message 
            });
        }
    }

    async updateSale(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            // Verificar se é uma venda
            const existingSale = await MovementService.getMovementById(id, userId);
            if (existingSale.movement_type_id !== 1) {
                return res.status(404).json({ error: 'Sale not found' });
            }

            const sale = await MovementService.updateMovement(id, req.body, userId);
            res.json(sale);
        } catch (error) {
            logger.error('Error in updateSale:', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Sale not found' });
            }
            if (error.message.includes('must be greater than')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteSale(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            // Verificar se é uma venda
            const existingSale = await MovementService.getMovementById(id, userId);
            if (existingSale.movement_type_id !== 1) {
                return res.status(404).json({ error: 'Sale not found' });
            }

            await MovementService.deleteMovement(id, userId);
            res.status(204).send();
        } catch (error) {
            logger.error('Error in deleteSale:', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Sale not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new SaleController();
