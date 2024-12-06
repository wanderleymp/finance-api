const logger = require('../../config/logger');

class InstallmentController {
    constructor(installmentRepository) {
        this.installmentRepository = installmentRepository;
    }

    async getAllInstallments(req, res) {
        try {
            const { skip = 0, take = 10, status, payment_id, due_date_start, due_date_end } = req.query;

            const filters = {
                status,
                payment_id: payment_id ? parseInt(payment_id) : undefined,
                due_date_start,
                due_date_end
            };

            logger.info('Getting all installments', { filters, skip, take });

            const result = await this.installmentRepository.findAll(filters, parseInt(skip), parseInt(take));
            return res.json(result);
        } catch (error) {
            logger.error('Error getting all installments', { 
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getInstallmentById(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Getting installment by id', { id });

            const installment = await this.installmentRepository.findById(parseInt(id));
            
            if (!installment) {
                logger.warn('Installment not found', { id });
                return res.status(404).json({ error: 'Installment not found' });
            }

            return res.json(installment);
        } catch (error) {
            logger.error('Error getting installment by id', { 
                id: req.params.id,
                error: error.message,
                stack: error.stack
            });
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
                movement_id,
                account_entry_id
            } = req.body;

            logger.info('Creating installment', { 
                payment_id, 
                amount, 
                due_date, 
                status, 
                installment_number,
                movement_id,
                account_entry_id
            });

            // Validate required fields
            if (!payment_id || !amount || !due_date || !status || !installment_number || !account_entry_id) {
                const error = 'Missing required fields';
                logger.warn('Validation error creating installment', { 
                    payment_id, 
                    amount, 
                    due_date, 
                    status, 
                    installment_number,
                    account_entry_id
                });
                return res.status(400).json({ error });
            }

            const installment = await this.installmentRepository.create({
                payment_id: parseInt(payment_id),
                amount: parseFloat(amount),
                due_date: new Date(due_date),
                status,
                installment_number,
                account_entry_id: parseInt(account_entry_id),
                movement_id: movement_id ? parseInt(movement_id) : null
            });

            logger.info('Installment created successfully', { 
                installment_id: installment.installment_id
            });

            return res.status(201).json(installment);
        } catch (error) {
            logger.error('Error creating installment', { 
                body: req.body,
                error: error.message,
                stack: error.stack
            });
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
                movement_id,
                account_entry_id,
                balance
            } = req.body;

            logger.info('Updating installment', { 
                id,
                payment_id, 
                amount, 
                due_date, 
                status, 
                installment_number,
                movement_id,
                account_entry_id,
                balance
            });

            const existingInstallment = await this.installmentRepository.findById(parseInt(id));
            if (!existingInstallment) {
                logger.warn('Installment not found for update', { id });
                return res.status(404).json({ error: 'Installment not found' });
            }

            const updatedInstallment = await this.installmentRepository.update(parseInt(id), {
                payment_id: payment_id ? parseInt(payment_id) : undefined,
                amount: amount ? parseFloat(amount) : undefined,
                due_date: due_date ? new Date(due_date) : undefined,
                status,
                installment_number,
                account_entry_id: account_entry_id ? parseInt(account_entry_id) : undefined,
                movement_id: movement_id ? parseInt(movement_id) : undefined,
                balance: balance ? parseFloat(balance) : undefined
            });

            logger.info('Installment updated successfully', { id });

            return res.json(updatedInstallment);
        } catch (error) {
            logger.error('Error updating installment', { 
                id: req.params.id,
                body: req.body,
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteInstallment(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Deleting installment', { id });

            const existingInstallment = await this.installmentRepository.findById(parseInt(id));
            if (!existingInstallment) {
                logger.warn('Installment not found for deletion', { id });
                return res.status(404).json({ error: 'Installment not found' });
            }

            await this.installmentRepository.delete(parseInt(id));

            logger.info('Installment deleted successfully', { id });

            return res.status(204).send();
        } catch (error) {
            logger.error('Error deleting installment', { 
                id: req.params.id,
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getInstallmentsByPaymentId(req, res) {
        try {
            const { paymentId } = req.params;

            logger.info('Getting installments by payment id', { paymentId });

            const installments = await this.installmentRepository.findByPaymentId(parseInt(paymentId));

            return res.json(installments);
        } catch (error) {
            logger.error('Error getting installments by payment id', { 
                payment_id: req.params.paymentId,
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getInstallmentsByMovementId(req, res) {
        try {
            const { movementId } = req.params;

            logger.info('Getting installments by movement id', { movementId });

            const installments = await this.installmentRepository.findByMovementId(parseInt(movementId));

            return res.json(installments);
        } catch (error) {
            logger.error('Error getting installments by movement id', { 
                movement_id: req.params.movementId,
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = InstallmentController;
