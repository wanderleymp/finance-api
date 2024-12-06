const { PrismaClient } = require('@prisma/client');
const IInstallmentRepository = require('../IInstallmentRepository');
const logger = require('../../../config/logger');

class PrismaInstallmentRepository extends IInstallmentRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient();
    }

    async findAll() {
        try {
            return await this.prisma.installments.findMany({
                include: {
                    payment: true,
                    movement_payment: {
                        include: {
                            movement: {
                                include: {
                                    person: true
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            logger.error('Error finding all installments', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            return await this.prisma.installments.findUnique({
                where: { installment_id: id },
                include: {
                    payment: true,
                    movement_payment: {
                        include: {
                            movement: {
                                include: {
                                    person: true
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            logger.error('Error finding installment by id', { id, error });
            throw error;
        }
    }

    async create(data) {
        try {
            return await this.prisma.$transaction(async (prisma) => {
                const installment = await prisma.installments.create({
                    data: {
                        payment_id: data.payment_id,
                        amount: data.amount,
                        due_date: data.due_date,
                        status: data.status,
                        installment_number: data.installment_number
                    },
                    include: {
                        payment: true
                    }
                });

                if (data.movement_id) {
                    await prisma.movement_payments.create({
                        data: {
                            movement_id: data.movement_id,
                            installment_id: installment.installment_id,
                            amount: data.amount
                        }
                    });
                }

                return installment;
            });
        } catch (error) {
            logger.error('Error creating installment', { data, error });
            throw error;
        }
    }

    async update(id, data) {
        try {
            return await this.prisma.$transaction(async (prisma) => {
                const installment = await prisma.installments.update({
                    where: { installment_id: id },
                    data: {
                        payment_id: data.payment_id,
                        amount: data.amount,
                        due_date: data.due_date,
                        status: data.status,
                        installment_number: data.installment_number
                    },
                    include: {
                        payment: true,
                        movement_payment: true
                    }
                });

                if (data.movement_id && !installment.movement_payment) {
                    await prisma.movement_payments.create({
                        data: {
                            movement_id: data.movement_id,
                            installment_id: id,
                            amount: data.amount
                        }
                    });
                } else if (data.movement_id && installment.movement_payment) {
                    await prisma.movement_payments.update({
                        where: { movement_payment_id: installment.movement_payment.movement_payment_id },
                        data: {
                            movement_id: data.movement_id,
                            amount: data.amount
                        }
                    });
                }

                return installment;
            });
        } catch (error) {
            logger.error('Error updating installment', { id, data, error });
            throw error;
        }
    }

    async delete(id) {
        try {
            return await this.prisma.$transaction(async (prisma) => {
                // First delete related movement_payments
                await prisma.movement_payments.deleteMany({
                    where: { installment_id: id }
                });

                // Then delete the installment
                return await prisma.installments.delete({
                    where: { installment_id: id }
                });
            });
        } catch (error) {
            logger.error('Error deleting installment', { id, error });
            throw error;
        }
    }

    async findByPaymentId(paymentId) {
        try {
            return await this.prisma.installments.findMany({
                where: { payment_id: paymentId },
                include: {
                    payment: true,
                    movement_payment: {
                        include: {
                            movement: {
                                include: {
                                    person: true
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            logger.error('Error finding installments by payment id', { paymentId, error });
            throw error;
        }
    }

    async findByMovementId(movementId) {
        try {
            return await this.prisma.installments.findMany({
                where: {
                    movement_payment: {
                        movement_id: movementId
                    }
                },
                include: {
                    payment: true,
                    movement_payment: {
                        include: {
                            movement: {
                                include: {
                                    person: true
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            logger.error('Error finding installments by movement id', { movementId, error });
            throw error;
        }
    }
}

module.exports = PrismaInstallmentRepository;
