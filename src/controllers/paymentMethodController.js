const PrismaPaymentMethodRepository = require('../repositories/implementations/PrismaPaymentMethodRepository');
const logger = require('../../config/logger');

class PaymentMethodController {
    constructor() {
        this.repository = new PrismaPaymentMethodRepository();
    }

    async getAllPaymentMethods(req, res) {
        try {
            const { page = 1, limit = 10, active } = req.query;
            const skip = (page - 1) * limit;
            const filters = {};

            if (active !== undefined) {
                filters.active = active === 'true';
            }

            const result = await this.repository.getAllPaymentMethods(filters, parseInt(skip), parseInt(limit));
            res.json(result);
        } catch (error) {
            logger.error('Error in getAllPaymentMethods:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getPaymentMethodById(req, res) {
        try {
            const { id } = req.params;
            const paymentMethod = await this.repository.getPaymentMethodById(id);

            if (!paymentMethod) {
                return res.status(404).json({ error: 'Payment method not found' });
            }

            res.json(paymentMethod);
        } catch (error) {
            logger.error('Error in getPaymentMethodById:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createPaymentMethod(req, res) {
        try {
            const paymentMethod = await this.repository.createPaymentMethod(req.body);
            res.status(201).json(paymentMethod);
        } catch (error) {
            logger.error('Error in createPaymentMethod:', error);
            if (error.message === 'Account entry not found') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updatePaymentMethod(req, res) {
        try {
            const { id } = req.params;
            const paymentMethod = await this.repository.updatePaymentMethod(id, req.body);
            res.json(paymentMethod);
        } catch (error) {
            logger.error('Error in updatePaymentMethod:', error);
            if (error.message === 'Account entry not found') {
                return res.status(400).json({ error: error.message });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Payment method not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deletePaymentMethod(req, res) {
        try {
            const { id } = req.params;
            await this.repository.deletePaymentMethod(id);
            res.status(204).send();
        } catch (error) {
            logger.error('Error in deletePaymentMethod:', error);
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Payment method not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new PaymentMethodController();
