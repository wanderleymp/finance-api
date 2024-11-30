const { PrismaClient } = require('@prisma/client');
const IPaymentMethodRepository = require('../interfaces/IPaymentMethodRepository');
const logger = require('../../../config/logger');

class PrismaPaymentMethodRepository extends IPaymentMethodRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient();
    }

    async getAllPaymentMethods(filters = {}, skip = 0, take = 10) {
        try {
            const where = { ...filters };
            if (where.active === 'all') {
                delete where.active;
            }

            // Buscar o total de registros
            const total = await this.prisma.payment_methods.count({ where });

            // Buscar os registros da página atual
            const paymentMethods = await this.prisma.payment_methods.findMany({
                where,
                skip,
                take,
                orderBy: { description: 'asc' },
                include: {
                    account_entries: {
                        select: {
                            account_name: true,
                            account_code: true
                        }
                    }
                }
            });

            // Calcular metadados da paginação
            const totalPages = Math.ceil(total / take);
            const currentPage = Math.floor(skip / take) + 1;
            const hasNext = currentPage < totalPages;
            const hasPrevious = currentPage > 1;

            return {
                data: paymentMethods,
                pagination: {
                    total,
                    totalPages,
                    currentPage,
                    perPage: take,
                    hasNext,
                    hasPrevious
                }
            };
        } catch (error) {
            logger.error('Error fetching payment methods:', error);
            throw error;
        }
    }

    async getPaymentMethodById(id) {
        try {
            const paymentMethod = await this.prisma.payment_methods.findUnique({
                where: { payment_method_id: parseInt(id) },
                include: {
                    account_entries: {
                        select: {
                            account_name: true,
                            account_code: true
                        }
                    }
                }
            });

            return paymentMethod;
        } catch (error) {
            logger.error(`Error fetching payment method ${id}:`, error);
            throw error;
        }
    }

    async createPaymentMethod(data) {
        try {
            // Verificar se a conta contábil existe
            if (data.account_entry_id) {
                const accountEntry = await this.prisma.account_entries.findUnique({
                    where: { account_entry_id: parseInt(data.account_entry_id) }
                });

                if (!accountEntry) {
                    throw new Error('Account entry not found');
                }
            }

            // Criar o método de pagamento
            const paymentMethod = await this.prisma.payment_methods.create({
                data: {
                    ...data,
                    account_entry_id: data.account_entry_id ? parseInt(data.account_entry_id) : null,
                    active: true
                },
                include: {
                    account_entries: {
                        select: {
                            account_name: true,
                            account_code: true
                        }
                    }
                }
            });

            return paymentMethod;
        } catch (error) {
            logger.error('Error creating payment method:', error);
            throw error;
        }
    }

    async updatePaymentMethod(id, data) {
        try {
            // Validar ID
            if (!id || id <= 0) {
                logger.warn(`[Repository] Invalid payment method ID: ${id}`);
                throw new Error('Invalid payment method ID');
            }

            logger.info(`[Repository] Checking if payment method ${id} exists`);
            
            // Verificar se o método de pagamento existe
            const existingPaymentMethod = await this.prisma.payment_methods.findUnique({
                where: { payment_method_id: id }
            });

            if (!existingPaymentMethod) {
                logger.warn(`[Repository] Payment method ${id} not found`);
                throw new Error('Payment method not found');
            }

            logger.info(`[Repository] Payment method ${id} found, checking account entry if provided`);

            // Verificar se a conta contábil existe se fornecida
            if (data.account_entry_id) {
                const accountEntry = await this.prisma.account_entries.findUnique({
                    where: { account_entry_id: parseInt(data.account_entry_id) }
                });

                if (!accountEntry) {
                    logger.warn(`[Repository] Account entry ${data.account_entry_id} not found`);
                    throw new Error('Account entry not found');
                }
            }

            logger.info(`[Repository] Updating payment method ${id}`);

            const paymentMethod = await this.prisma.payment_methods.update({
                where: { payment_method_id: id },
                data: {
                    ...data,
                    account_entry_id: data.account_entry_id ? parseInt(data.account_entry_id) : undefined
                },
                include: {
                    account_entries: {
                        select: {
                            account_name: true,
                            account_code: true
                        }
                    }
                }
            });

            logger.info(`[Repository] Payment method ${id} updated successfully`);
            return paymentMethod;
        } catch (error) {
            logger.error(`[Repository] Error updating payment method ${id}. Error:`, error);
            logger.error(`[Repository] Update data:`, data);
            throw error;
        }
    }

    async deletePaymentMethod(id) {
        try {
            await this.prisma.payment_methods.delete({
                where: { payment_method_id: parseInt(id) }
            });
            return true;
        } catch (error) {
            logger.error(`Error deleting payment method ${id}:`, error);
            throw error;
        }
    }
}

module.exports = PrismaPaymentMethodRepository;
