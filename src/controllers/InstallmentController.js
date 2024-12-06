const logger = require('../../config/logger');

class InstallmentController {
    constructor(installmentRepository) {
        this.installmentRepository = installmentRepository;
    }

    async getAllInstallments(req, res) {
        try {
            const installments = await this.installmentRepository.findAll();
            return res.json(installments);
        } catch (error) {
            logger.error('Error getting all installments', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getInstallmentById(req, res) {
        try {
            const { id } = req.params;
            const installment = await this.installmentRepository.findById(parseInt(id));
            
            if (!installment) {
                return res.status(404).json({ error: 'Installment not found' });
            }

            return res.json(installment);
        } catch (error) {
            logger.error('Error getting installment by id', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createInstallment(req, res) {
        try {
            const {
                payment_id,
                amount,
                due_date,
                status,
                installment_number,
                movement_id
            } = req.body;

            if (!payment_id || !amount || !due_date || !status || !installment_number) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const installment = await this.installmentRepository.create({
                payment_id: parseInt(payment_id),
                amount: parseFloat(amount),
                due_date: new Date(due_date),
                status,
                installment_number: parseInt(installment_number),
                movement_id: movement_id ? parseInt(movement_id) : null
            });

            return res.status(201).json(installment);
        } catch (error) {
            logger.error('Error creating installment', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateInstallment(req, res) {
        try {
            const { id } = req.params;
            const {
                payment_id,
                amount,
                due_date,
                status,
                installment_number,
                movement_id
            } = req.body;

            const existingInstallment = await this.installmentRepository.findById(parseInt(id));
            if (!existingInstallment) {
                return res.status(404).json({ error: 'Installment not found' });
            }

            const updatedInstallment = await this.installmentRepository.update(parseInt(id), {
                payment_id: payment_id ? parseInt(payment_id) : undefined,
                amount: amount ? parseFloat(amount) : undefined,
                due_date: due_date ? new Date(due_date) : undefined,
                status,
                installment_number: installment_number ? parseInt(installment_number) : undefined,
                movement_id: movement_id ? parseInt(movement_id) : undefined
            });

            return res.json(updatedInstallment);
        } catch (error) {
            logger.error('Error updating installment', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteInstallment(req, res) {
        try {
            const { id } = req.params;
            
            const existingInstallment = await this.installmentRepository.findById(parseInt(id));
            if (!existingInstallment) {
                return res.status(404).json({ error: 'Installment not found' });
            }

            await this.installmentRepository.delete(parseInt(id));
            return res.status(204).send();
        } catch (error) {
            logger.error('Error deleting installment', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getInstallmentsByPaymentId(req, res) {
        try {
            const { paymentId } = req.params;
            const installments = await this.installmentRepository.findByPaymentId(parseInt(paymentId));
            return res.json(installments);
        } catch (error) {
            logger.error('Error getting installments by payment id', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getInstallmentsByMovementId(req, res) {
        try {
            const { movementId } = req.params;
            const installments = await this.installmentRepository.findByMovementId(parseInt(movementId));
            return res.json(installments);
        } catch (error) {
            logger.error('Error getting installments by movement id', { error });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = InstallmentController;
