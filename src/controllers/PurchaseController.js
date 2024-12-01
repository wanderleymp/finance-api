const MovementService = require('../services/MovementService');
const logger = require('../../config/logger');

class PurchaseController {
    async createPurchase(req, res) {
        try {
            const userId = req.user.id;
            const purchaseData = {
                ...req.body,
                movement_type_id: 2  // Tipo "Compra"
            };

            const purchase = await MovementService.createMovement(purchaseData, userId);
            res.status(201).json(purchase);
        } catch (error) {
            logger.error('Error in createPurchase:', error);
            if (error.message.includes('required')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getPurchaseById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            const purchase = await MovementService.getMovementById(id, userId);
            
            // Verificar se é uma compra
            if (purchase.movement_type_id !== 2) {
                return res.status(404).json({ error: 'Purchase not found' });
            }

            res.json(purchase);
        } catch (error) {
            logger.error('Error in getPurchaseById:', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Purchase not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllPurchases(req, res) {
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
                movement_type_id: 2, // Tipo "Compra"
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
            logger.error('Error in getAllPurchases:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                message: error.message 
            });
        }
    }

    async updatePurchase(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            // Verificar se é uma compra
            const existingPurchase = await MovementService.getMovementById(id, userId);
            if (existingPurchase.movement_type_id !== 2) {
                return res.status(404).json({ error: 'Purchase not found' });
            }

            const purchase = await MovementService.updateMovement(id, req.body, userId);
            res.json(purchase);
        } catch (error) {
            logger.error('Error in updatePurchase:', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Purchase not found' });
            }
            if (error.message.includes('must be greater than')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deletePurchase(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            // Verificar se é uma compra
            const existingPurchase = await MovementService.getMovementById(id, userId);
            if (existingPurchase.movement_type_id !== 2) {
                return res.status(404).json({ error: 'Purchase not found' });
            }

            await MovementService.deleteMovement(id, userId);
            res.status(204).send();
        } catch (error) {
            logger.error('Error in deletePurchase:', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Purchase not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new PurchaseController();
