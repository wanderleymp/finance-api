const logger = require('../../config/logger');
const InstallmentGenerationService = require('../services/InstallmentGenerationService');

class MovementPaymentController {
    constructor(movementPaymentRepository) {
        this.movementPaymentRepository = movementPaymentRepository;
        this.installmentGenerationService = new InstallmentGenerationService();
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
                payment_method_id,
                total_amount
            } = req.body;

            if (!movement_id || !payment_method_id || !total_amount) {
                return res.status(400).json({ 
                    error: 'movement_id, payment_method_id and total_amount are required' 
                });
            }

            const result = await this.movementPaymentRepository.createMovementPaymentWithInstallments({
                movement_id: parseInt(movement_id),
                payment_method_id: parseInt(payment_method_id),
                total_amount: parseFloat(total_amount)
            });
            
            return res.status(201).json({
                payment: result.movementPayment,
                installments: result.installments
            });
        } catch (error) {
            logger.error('Error creating movement payment', { error });
            if (error.message === 'Movement not found') {
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
                total_amount,
                status
            } = req.body;

            const payment = await this.movementPaymentRepository.update(parseInt(id), {
                movement_id: movement_id ? parseInt(movement_id) : undefined,
                total_amount: total_amount ? parseFloat(total_amount) : undefined,
                status: status ? status : undefined
            });

            return res.json(payment);
        } catch (error) {
            logger.error('Error updating movement payment', { error });
            if (error.message === 'Movement payment not found' || 
                error.message === 'Movement not found') {
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
