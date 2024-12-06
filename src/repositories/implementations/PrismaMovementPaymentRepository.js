const { PrismaClient } = require('@prisma/client');
const IMovementPaymentRepository = require('../IMovementPaymentRepository');
const logger = require('../../../config/logger');

class PrismaMovementPaymentRepository extends IMovementPaymentRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient();
    }

    async findAll() {
        try {
            return await this.prisma.movement_payments.findMany({
                include: {
                    movement: {
                        include: {
                            person: true,
                            movement_type: true,
                            movement_status: true
                        }
                    },
                    installment: {
                        include: {
                            payment: true
                        }
                    }
                }
            });
        } catch (error) {
            logger.error('Error finding all movement payments', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            return await this.prisma.movement_payments.findUnique({
                where: { movement_payment_id: id },
                include: {
                    movement: {
                        include: {
                            person: true,
                            movement_type: true,
                            movement_status: true
                        }
                    },
                    installment: {
                        include: {
                            payment: true
                        }
                    }
                }
            });
        } catch (error) {
            logger.error('Error finding movement payment by id', { id, error });
            throw error;
        }
    }

    async create(data) {
        try {
            return await this.prisma.$transaction(async (prisma) => {
                // Verify if movement exists
                const movement = await prisma.movements.findUnique({
                    where: { movement_id: data.movement_id }
                });

                if (!movement) {
                    throw new Error('Movement not found');
                }

                // If installment_id is provided, verify if it exists
                if (data.installment_id) {
                    const installment = await prisma.installments.findUnique({
                        where: { installment_id: data.installment_id }
                    });

                    if (!installment) {
                        throw new Error('Installment not found');
                    }
                }

                return await prisma.movement_payments.create({
                    data: {
                        movement_id: data.movement_id,
                        installment_id: data.installment_id,
                        amount: data.amount,
                        payment_date: data.payment_date || new Date()
                    },
                    include: {
                        movement: {
                            include: {
                                person: true,
                                movement_type: true,
                                movement_status: true
                            }
                        },
                        installment: {
                            include: {
                                payment: true
                            }
                        }
                    }
                });
            });
        } catch (error) {
            logger.error('Error creating movement payment', { data, error });
            throw error;
        }
    }

    async update(id, data) {
        try {
            return await this.prisma.$transaction(async (prisma) => {
                // Verify if movement payment exists
                const existingPayment = await prisma.movement_payments.findUnique({
                    where: { movement_payment_id: id }
                });

                if (!existingPayment) {
                    throw new Error('Movement payment not found');
                }

                // If movement_id is being updated, verify if new movement exists
                if (data.movement_id) {
                    const movement = await prisma.movements.findUnique({
                        where: { movement_id: data.movement_id }
                    });

                    if (!movement) {
                        throw new Error('Movement not found');
                    }
                }

                // If installment_id is being updated, verify if new installment exists
                if (data.installment_id) {
                    const installment = await prisma.installments.findUnique({
                        where: { installment_id: data.installment_id }
                    });

                    if (!installment) {
                        throw new Error('Installment not found');
                    }
                }

                return await prisma.movement_payments.update({
                    where: { movement_payment_id: id },
                    data: {
                        movement_id: data.movement_id,
                        installment_id: data.installment_id,
                        amount: data.amount,
                        payment_date: data.payment_date
                    },
                    include: {
                        movement: {
                            include: {
                                person: true,
                                movement_type: true,
                                movement_status: true
                            }
                        },
                        installment: {
                            include: {
                                payment: true
                            }
                        }
                    }
                });
            });
        } catch (error) {
            logger.error('Error updating movement payment', { id, data, error });
            throw error;
        }
    }

    async delete(id) {
        try {
            const existingPayment = await this.prisma.movement_payments.findUnique({
                where: { movement_payment_id: id }
            });

            if (!existingPayment) {
                throw new Error('Movement payment not found');
            }

            return await this.prisma.movement_payments.delete({
                where: { movement_payment_id: id }
            });
        } catch (error) {
            logger.error('Error deleting movement payment', { id, error });
            throw error;
        }
    }

    async findByMovementId(movementId) {
        try {
            return await this.prisma.movement_payments.findMany({
                where: { movement_id: movementId },
                include: {
                    movement: {
                        include: {
                            person: true,
                            movement_type: true,
                            movement_status: true
                        }
                    },
                    installment: {
                        include: {
                            payment: true
                        }
                    }
                }
            });
        } catch (error) {
            logger.error('Error finding movement payments by movement id', { movementId, error });
            throw error;
        }
    }

    async findByInstallmentId(installmentId) {
        try {
            return await this.prisma.movement_payments.findMany({
                where: { installment_id: installmentId },
                include: {
                    movement: {
                        include: {
                            person: true,
                            movement_type: true,
                            movement_status: true
                        }
                    },
                    installment: {
                        include: {
                            payment: true
                        }
                    }
                }
            });
        } catch (error) {
            logger.error('Error finding movement payments by installment id', { installmentId, error });
            throw error;
        }
    }
}

module.exports = PrismaMovementPaymentRepository;
