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
            logger.info('🔍 [PAYMENT-FIND-ALL-START] Buscando todos os pagamentos de movimento');

            const payments = await this.prisma.movement_payments.findMany({
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

            logger.info('🟢 [PAYMENT-FIND-ALL-SUCCESS] Pagamentos de movimento encontrados', { count: payments.length });

            return payments;
        } catch (error) {
            logger.error('🔴 [PAYMENT-FIND-ALL-ERROR] Erro ao buscar pagamentos de movimento', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.info('🔍 [PAYMENT-FIND-BY-ID-START] Buscando pagamento de movimento por ID', { id });

            const payment = await this.prisma.movement_payments.findUnique({
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

            if (!payment) {
                logger.warn('🟠 [PAYMENT-NOT-FOUND] Nenhum pagamento de movimento encontrado para o ID', { id });
                return null;
            }

            logger.info('🟢 [PAYMENT-FOUND] Pagamento de movimento encontrado', { id });

            return payment;
        } catch (error) {
            logger.error('🔴 [PAYMENT-FIND-ERROR] Erro ao buscar pagamento de movimento', { id, error });
            throw error;
        }
    }

    async create(data) {
        try {
            logger.info('🟢 [PAYMENT-CREATE-START] Iniciando criação de pagamento de movimento', { 
                movement_id: data.movement_id, 
                installment_id: data.installment_id, 
                amount: data.amount 
            });

            // Verify if movement exists
            const movement = await this.prisma.movements.findUnique({
                where: { movement_id: data.movement_id }
            });

            if (!movement) {
                throw new Error('Movement not found');
            }

            // If installment_id is provided, verify if it exists
            if (data.installment_id) {
                const installment = await this.prisma.installments.findUnique({
                    where: { installment_id: data.installment_id }
                });

                if (!installment) {
                    throw new Error('Installment not found');
                }
            }

            const payment = await this.prisma.$transaction(async (prisma) => {
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

            logger.info('🟢 [PAYMENT-CREATE-SUCCESS] Pagamento de movimento criado com sucesso', { 
                payment_id: payment.movement_payment_id, 
                movement_id: payment.movement_id,
                amount: payment.amount 
            });

            return payment;
        } catch (error) {
            logger.error('🔴 [PAYMENT-CREATE-ERROR] Erro ao criar pagamento de movimento', { 
                error: error.message, 
                stack: error.stack,
                data,
                errorCode: error.code
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('🔄 [PAYMENT-UPDATE-START] Atualizando pagamento de movimento', { 
                id, 
                data 
            });

            // Verify if movement payment exists
            const existingPayment = await this.prisma.movement_payments.findUnique({
                where: { movement_payment_id: id }
            });

            if (!existingPayment) {
                throw new Error('Movement payment not found');
            }

            // If movement_id is being updated, verify if new movement exists
            if (data.movement_id) {
                const movement = await this.prisma.movements.findUnique({
                    where: { movement_id: data.movement_id }
                });

                if (!movement) {
                    throw new Error('Movement not found');
                }
            }

            // If installment_id is being updated, verify if new installment exists
            if (data.installment_id) {
                const installment = await this.prisma.installments.findUnique({
                    where: { installment_id: data.installment_id }
                });

                if (!installment) {
                    throw new Error('Installment not found');
                }
            }

            const updatedPayment = await this.prisma.$transaction(async (prisma) => {
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

            logger.info('🟢 [PAYMENT-UPDATE-SUCCESS] Pagamento de movimento atualizado com sucesso', { 
                payment_id: updatedPayment.movement_payment_id,
                movement_id: updatedPayment.movement_id 
            });

            return updatedPayment;
        } catch (error) {
            logger.error('🔴 [PAYMENT-UPDATE-ERROR] Erro ao atualizar pagamento de movimento', { 
                error: error.message, 
                stack: error.stack,
                id, 
                data 
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('🗑️ [PAYMENT-DELETE-START] Excluindo pagamento de movimento', { id });

            const existingPayment = await this.prisma.movement_payments.findUnique({
                where: { movement_payment_id: id }
            });

            if (!existingPayment) {
                throw new Error('Movement payment not found');
            }

            const deletedPayment = await this.prisma.movement_payments.delete({
                where: { movement_payment_id: id }
            });

            logger.info('🟢 [PAYMENT-DELETE-SUCCESS] Pagamento de movimento excluído com sucesso', { 
                payment_id: deletedPayment.movement_payment_id,
                movement_id: deletedPayment.movement_id 
            });

            return deletedPayment;
        } catch (error) {
            logger.error('🔴 [PAYMENT-DELETE-ERROR] Erro ao excluir pagamento de movimento', { 
                error: error.message, 
                stack: error.stack,
                id 
            });
            throw error;
        }
    }

    async findByMovementId(movementId) {
        try {
            logger.info('🔍 [PAYMENT-FIND-BY-MOVEMENT-START] Buscando pagamentos de movimento por ID de movimento', { movementId });

            const payments = await this.prisma.movement_payments.findMany({
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

            logger.info('🟢 [PAYMENT-FIND-BY-MOVEMENT-SUCCESS] Pagamentos de movimento encontrados', { count: payments.length });

            return payments;
        } catch (error) {
            logger.error('🔴 [PAYMENT-FIND-BY-MOVEMENT-ERROR] Erro ao buscar pagamentos de movimento', { movementId, error });
            throw error;
        }
    }

    async findByInstallmentId(installmentId) {
        try {
            logger.info('🔍 [PAYMENT-FIND-BY-INSTALLMENT-START] Buscando pagamentos de movimento por ID de parcela', { installmentId });

            const payments = await this.prisma.movement_payments.findMany({
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

            logger.info('🟢 [PAYMENT-FIND-BY-INSTALLMENT-SUCCESS] Pagamentos de movimento encontrados', { count: payments.length });

            return payments;
        } catch (error) {
            logger.error('🔴 [PAYMENT-FIND-BY-INSTALLMENT-ERROR] Erro ao buscar pagamentos de movimento', { installmentId, error });
            throw error;
        }
    }
}

module.exports = PrismaMovementPaymentRepository;
