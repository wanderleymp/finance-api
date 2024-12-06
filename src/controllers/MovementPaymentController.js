const logger = require('../../config/logger');

class MovementPaymentController {
    constructor(movementPaymentRepository) {
        this.movementPaymentRepository = movementPaymentRepository;
    }

    async getAllMovementPayments(req, res) {
        try {
            const payments = await this.movementPaymentRepository.findAll();
            return res.json(payments);
        } catch (error) {
            logger.error('Error getting all movement payments', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMovementPaymentById(req, res) {
        try {
            const { id } = req.params;
            const payment = await this.movementPaymentRepository.findById(parseInt(id));
            
            if (!payment) {
                return res.status(404).json({ error: 'Movement payment not found' });
            }

            return res.json(payment);
        } catch (error) {
            logger.error('Error getting movement payment by id', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createMovementPayment(req, res) {
        try {
            const {
                movement_id,
                installment_id,
                amount,
                payment_date
            } = req.body;

            if (!movement_id || !amount) {
                return res.status(400).json({ error: 'movement_id and amount are required' });
            }

            const payment = await this.movementPaymentRepository.create({
                movement_id: parseInt(movement_id),
                installment_id: installment_id ? parseInt(installment_id) : null,
                amount: parseFloat(amount),
                payment_date: payment_date ? new Date(payment_date) : new Date()
            });

            return res.status(201).json(payment);
        } catch (error) {
            logger.error('Error creating movement payment', { error });
            if (error.message === 'Movement not found' || error.message === 'Installment not found') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateMovementPayment(req, res) {
        try {
            const { id } = req.params;
            const {
                movement_id,
                installment_id,
                amount,
                payment_date
            } = req.body;

            const payment = await this.movementPaymentRepository.update(parseInt(id), {
                movement_id: movement_id ? parseInt(movement_id) : undefined,
                installment_id: installment_id ? parseInt(installment_id) : undefined,
                amount: amount ? parseFloat(amount) : undefined,
                payment_date: payment_date ? new Date(payment_date) : undefined
            });

            return res.json(payment);
        } catch (error) {
            logger.error('Error updating movement payment', { error });
            if (error.message === 'Movement payment not found' || 
                error.message === 'Movement not found' || 
                error.message === 'Installment not found') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteMovementPayment(req, res) {
        try {
            const { id } = req.params;
            
            await this.movementPaymentRepository.delete(parseInt(id));
            return res.status(204).send();
        } catch (error) {
            logger.error('Error deleting movement payment', { error });
            if (error.message === 'Movement payment not found') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMovementPaymentsByMovementId(req, res) {
        try {
            const { movementId } = req.params;
            const payments = await this.movementPaymentRepository.findByMovementId(parseInt(movementId));
            return res.json(payments);
        } catch (error) {
            logger.error('Error getting movement payments by movement id', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMovementPaymentsByInstallmentId(req, res) {
        try {
            const { installmentId } = req.params;
            const payments = await this.movementPaymentRepository.findByInstallmentId(parseInt(installmentId));
            return res.json(payments);
        } catch (error) {
            logger.error('Error getting movement payments by installment id', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = MovementPaymentController;
