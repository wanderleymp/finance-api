const logger = require('../../config/logger');

class InstallmentController {
    constructor(installmentRepository) {
        this.installmentRepository = installmentRepository;
    }

    async getAllInstallments(req, res) {
        try {
            console.log('Raw Query Parameters:', JSON.stringify(req.query, null, 2));
            
            const { skip = 0, take = 10, status, search, expected_start_date, expected_end_date, due_date_start, due_date_end } = req.query;

            console.log('Extracted Query Parameters:', JSON.stringify({
                skip, 
                take, 
                status, 
                search, 
                expected_start_date, 
                expected_end_date, 
                due_date_start, 
                due_date_end
            }, null, 2));

            const filters = {
                status,
                due_start_date: due_date_start,
                due_end_date: due_date_end,
                search,
                expected_start_date,
                expected_end_date
            };

            console.log('Filters Debugging:', JSON.stringify({
                rawQuery: req.query,
                filters,
                expectedStartDateType: typeof filters.expected_start_date,
                expectedStartDateValue: filters.expected_start_date,
                expectedEndDateType: typeof filters.expected_end_date,
                expectedEndDateValue: filters.expected_end_date,
                dueStartDateType: typeof filters.due_start_date,
                dueStartDateValue: filters.due_start_date,
                dueEndDateType: typeof filters.due_end_date,
                dueEndDateValue: filters.due_end_date
            }, null, 2));

            console.log('Getting all installments:', JSON.stringify({ filters, skip, take }, null, 2));

            const result = await this.installmentRepository.findAll(filters, parseInt(skip), parseInt(take));
            return res.json(result);
        } catch (error) {
            console.log('Error getting all installments:', JSON.stringify({ 
                error: error.message,
                stack: error.stack
            }, null, 2));
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getInstallmentById(req, res) {
        try {
            const { id } = req.params;
            
            console.log('Getting installment by id:', JSON.stringify({ id }, null, 2));

            const installment = await this.installmentRepository.findById(parseInt(id));
            
            if (!installment) {
                console.log('Installment not found:', JSON.stringify({ id }, null, 2));
                return res.status(404).json({ error: 'Installment not found' });
            }

            return res.json(installment);
        } catch (error) {
            console.log('Error getting installment by id:', JSON.stringify({ 
                id: req.params.id,
                error: error.message,
                stack: error.stack
            }, null, 2));
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

            console.log('Creating installment:', JSON.stringify({ 
                payment_id, 
                amount, 
                due_date, 
                status, 
                installment_number,
                movement_id,
                account_entry_id
            }, null, 2));

            // Validate required fields
            if (!payment_id || !amount || !due_date || !status || !installment_number || !account_entry_id) {
                const error = 'Missing required fields';
                console.log('Validation error creating installment:', JSON.stringify({ 
                    payment_id, 
                    amount, 
                    due_date, 
                    status, 
                    installment_number,
                    account_entry_id
                }, null, 2));
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

            console.log('Installment created successfully:', JSON.stringify({ 
                installment_id: installment.installment_id
            }, null, 2));

            return res.status(201).json(installment);
        } catch (error) {
            console.log('Error creating installment:', JSON.stringify({ 
                body: req.body,
                error: error.message,
                stack: error.stack
            }, null, 2));
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

            console.log('Updating installment:', JSON.stringify({ 
                id,
                payment_id, 
                amount, 
                due_date, 
                status, 
                installment_number,
                movement_id,
                account_entry_id,
                balance
            }, null, 2));

            const existingInstallment = await this.installmentRepository.findById(parseInt(id));
            if (!existingInstallment) {
                console.log('Installment not found for update:', JSON.stringify({ id }, null, 2));
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

            console.log('Installment updated successfully:', JSON.stringify({ id }, null, 2));

            return res.json(updatedInstallment);
        } catch (error) {
            console.log('Error updating installment:', JSON.stringify({ 
                id: req.params.id,
                body: req.body,
                error: error.message,
                stack: error.stack
            }, null, 2));
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteInstallment(req, res) {
        try {
            const { id } = req.params;
            
            console.log('Deleting installment:', JSON.stringify({ id }, null, 2));

            const existingInstallment = await this.installmentRepository.findById(parseInt(id));
            if (!existingInstallment) {
                console.log('Installment not found for deletion:', JSON.stringify({ id }, null, 2));
                return res.status(404).json({ error: 'Installment not found' });
            }

            await this.installmentRepository.delete(parseInt(id));

            console.log('Installment deleted successfully:', JSON.stringify({ id }, null, 2));

            return res.status(204).send();
        } catch (error) {
            console.log('Error deleting installment:', JSON.stringify({ 
                id: req.params.id,
                error: error.message,
                stack: error.stack
            }, null, 2));
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getInstallmentsByPaymentId(req, res) {
        try {
            const { paymentId } = req.params;

            console.log('Getting installments by payment id:', JSON.stringify({ paymentId }, null, 2));

            const installments = await this.installmentRepository.findByPaymentId(parseInt(paymentId));

            return res.json(installments);
        } catch (error) {
            console.log('Error getting installments by payment id:', JSON.stringify({ 
                payment_id: req.params.paymentId,
                error: error.message,
                stack: error.stack
            }, null, 2));
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getInstallmentsByMovementId(req, res) {
        try {
            const { movementId } = req.params;

            console.log('Getting installments by movement id:', JSON.stringify({ movementId }, null, 2));

            const installments = await this.installmentRepository.findByMovementId(parseInt(movementId));

            return res.json(installments);
        } catch (error) {
            console.log('Error getting installments by movement id:', JSON.stringify({ 
                movement_id: req.params.movementId,
                error: error.message,
                stack: error.stack
            }, null, 2));
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = InstallmentController;
