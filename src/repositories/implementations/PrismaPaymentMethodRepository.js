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
            // Verificar se a conta contábil existe se fornecida
            if (data.account_entry_id) {
                const accountEntry = await this.prisma.account_entries.findUnique({
                    where: { account_entry_id: parseInt(data.account_entry_id) }
                });

                if (!accountEntry) {
                    throw new Error('Account entry not found');
                }
            }

            const paymentMethod = await this.prisma.payment_methods.update({
                where: { payment_method_id: parseInt(id) },
                data: {
                    ...data,
                    account_entry_id: data.account_entry_id ? parseInt(data.account_entry_id) : undefined,
                    active: data.active === true || data.active === 'true'
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
            logger.error(`Error updating payment method ${id}:`, error);
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
