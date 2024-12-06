const { PrismaClient } = require('@prisma/client');
const IInstallmentRepository = require('../IInstallmentRepository');
const logger = require('../../../config/logger');

class PrismaInstallmentRepository extends IInstallmentRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient();
    }

    async findAll(filters = {}, skip = 0, take = 10) {
        try {
            logger.info('Finding all installments with filters', { filters, skip, take });

            // Build where clause
            const where = {};
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.payment_id) {
                where.payment_id = parseInt(filters.payment_id);
            }
            if (filters.due_date_start) {
                where.due_date = {
                    ...where.due_date,
                    gte: new Date(filters.due_date_start)
                };
            }
            if (filters.due_date_end) {
                where.due_date = {
                    ...where.due_date,
                    lte: new Date(filters.due_date_end)
                };
            }

            // Get total count for pagination
            const total = await this.prisma.installments.count({ where });

            // Get paginated results
            const installments = await this.prisma.installments.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(take),
                orderBy: {
                    due_date: 'asc'
                },
                include: {
                    account_entries: true,
                    boletos: true,
                    installment_payments: true,
                    receipts: true
                }
            });

            // Calculate pagination metadata
            const totalPages = Math.ceil(total / take);
            const currentPage = Math.floor(skip / take) + 1;

            logger.info('Found installments', { 
                count: installments.length,
                total,
                currentPage,
                totalPages
            });

            return {
                data: installments,
                pagination: {
                    total,
                    currentPage,
                    totalPages,
                    hasNext: currentPage < totalPages,
                    hasPrevious: currentPage > 1,
                    take,
                    skip
                }
            };
        } catch (error) {
            logger.error('Error finding all installments', { 
                filters,
                skip,
                take,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.info('Finding installment by id', { id });

            const installment = await this.prisma.installments.findUnique({
                where: { installment_id: parseInt(id) },
                include: {
                    account_entries: true,
                    boletos: true,
                    installment_payments: true,
                    receipts: true
                }
            });

            if (!installment) {
                logger.warn('Installment not found', { id });
                return null;
            }

            logger.info('Found installment', { id });
            return installment;
        } catch (error) {
            logger.error('Error finding installment by id', { 
                id, 
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async create(data) {
        try {
            logger.info('Creating installment', { data });

            // Validate required fields
            if (!data.payment_id || !data.amount || !data.due_date || !data.status || !data.installment_number || !data.account_entry_id) {
                const error = new Error('Missing required fields');
                logger.error('Validation error creating installment', { 
                    data,
                    error: error.message
                });
                throw error;
            }

            return await this.prisma.$transaction(async (prisma) => {
                const installment = await prisma.installments.create({
                    data: {
                        payment_id: parseInt(data.payment_id),
                        amount: parseFloat(data.amount),
                        balance: parseFloat(data.amount), // Initial balance is the same as amount
                        due_date: new Date(data.due_date),
                        status: data.status,
                        installment_number: data.installment_number,
                        account_entry_id: parseInt(data.account_entry_id)
                    },
                    include: {
                        account_entries: true,
                        boletos: true,
                        installment_payments: true,
                        receipts: true
                    }
                });

                logger.info('Created installment successfully', { 
                    installment_id: installment.installment_id
                });

                return installment;
            });
        } catch (error) {
            logger.error('Error creating installment', { 
                data,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Updating installment', { id, data });

            return await this.prisma.$transaction(async (prisma) => {
                // Check if installment exists
                const existingInstallment = await prisma.installments.findUnique({
                    where: { installment_id: parseInt(id) },
                    include: {
                        account_entries: true,
                        boletos: true,
                        installment_payments: true,
                        receipts: true
                    }
                });

                if (!existingInstallment) {
                    const error = new Error('Installment not found');
                    logger.error('Error updating installment - not found', { id });
                    throw error;
                }

                const installment = await prisma.installments.update({
                    where: { installment_id: parseInt(id) },
                    data: {
                        payment_id: data.payment_id ? parseInt(data.payment_id) : undefined,
                        amount: data.amount ? parseFloat(data.amount) : undefined,
                        balance: data.balance ? parseFloat(data.balance) : undefined,
                        due_date: data.due_date ? new Date(data.due_date) : undefined,
                        status: data.status,
                        installment_number: data.installment_number,
                        account_entry_id: data.account_entry_id ? parseInt(data.account_entry_id) : undefined
                    },
                    include: {
                        account_entries: true,
                        boletos: true,
                        installment_payments: true,
                        receipts: true
                    }
                });

                logger.info('Updated installment successfully', { id });
                return installment;
            });
        } catch (error) {
            logger.error('Error updating installment', { 
                id,
                data,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deleting installment', { id });

            return await this.prisma.$transaction(async (prisma) => {
                // Check if installment exists
                const existingInstallment = await prisma.installments.findUnique({
                    where: { installment_id: parseInt(id) }
                });

                if (!existingInstallment) {
                    const error = new Error('Installment not found');
                    logger.error('Error deleting installment - not found', { id });
                    throw error;
                }

                // Delete the installment
                const deletedInstallment = await prisma.installments.delete({
                    where: { installment_id: parseInt(id) }
                });

                logger.info('Deleted installment successfully', { id });
                return deletedInstallment;
            });
        } catch (error) {
            logger.error('Error deleting installment', { 
                id,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async findByPaymentId(paymentId) {
        try {
            logger.info('Finding installments by payment id', { paymentId });

            const installments = await this.prisma.installments.findMany({
                where: { payment_id: parseInt(paymentId) },
                include: {
                    account_entries: true,
                    boletos: true,
                    installment_payments: true,
                    receipts: true
                }
            });

            logger.info('Found installments by payment id', { 
                paymentId,
                count: installments.length
            });

            return installments;
        } catch (error) {
            logger.error('Error finding installments by payment id', { 
                paymentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async findByMovementId(movementId) {
        try {
            logger.info('Finding installments by movement id is no longer supported', { movementId });
            return [];
        } catch (error) {
            logger.error('Error finding installments by movement id', { 
                movementId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = PrismaInstallmentRepository;
