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
            logger.info('🔄 [MOVEMENT-PAYMENT-CREATE-START] Criando pagamento de movimento', { data });

            const movementPayment = await this.prisma.movement_payments.create({
                data: {
                    movement_id: data.movement_id,
                    payment_method_id: data.payment_method_id,
                    total_amount: data.total_amount,
                    status: 'Pendente'
                }
            });

            logger.info('🟢 [MOVEMENT-PAYMENT-CREATE-SUCCESS] Pagamento de movimento criado', { 
                payment_id: movementPayment.payment_id
            });

            return movementPayment;
        } catch (error) {
            logger.error('🔴 [MOVEMENT-PAYMENT-CREATE-ERROR] Erro ao criar pagamento de movimento', { 
                error: error.message, 
                stack: error.stack,
                data
            });
            throw error;
        }
    }

    async generateInstallments(data) {
        try {
            logger.info('🔄 [INSTALLMENTS-GENERATE-START] Gerando parcelas para pagamento', { data });

            // Buscar método de pagamento
            const paymentMethod = await this.prisma.payment_methods.findUnique({
                where: { payment_method_id: data.payment_method_id }
            });

            if (!paymentMethod) {
                throw new Error('Método de pagamento não encontrado');
            }

            // Calcular parcelas
            const totalInstallments = paymentMethod.installment_count || 1;
            const baseInstallmentAmount = Number((data.total_amount / totalInstallments).toFixed(2));
            const roundingDifference = Number((data.total_amount - (baseInstallmentAmount * totalInstallments)).toFixed(2));

            // Definir data base para cálculo das parcelas
            const baseDate = new Date(data.movement_date || new Date());
            const firstDueDate = new Date(baseDate);
            firstDueDate.setDate(firstDueDate.getDate() + (paymentMethod.first_due_date_days || 0));

            // Verificar se já existem parcelas para este pagamento
            const existingInstallments = await this.prisma.installments.findMany({
                where: { 
                    payment_id: data.payment_id,
                    deleted_at: null // Apenas parcelas não deletadas
                }
            });

            if (existingInstallments && existingInstallments.length > 0) {
                logger.warn('⚠️ [INSTALLMENTS-ALREADY-EXISTS] Já existem parcelas para este pagamento', {
                    payment_id: data.payment_id,
                    existing_installments: existingInstallments.length
                });
                return existingInstallments;
            }

            // Gerar parcelas
            const installments = [];
            for (let i = 1; i <= totalInstallments; i++) {
                const isLastInstallment = i === totalInstallments;
                const installmentAmount = isLastInstallment 
                    ? baseInstallmentAmount + roundingDifference 
                    : baseInstallmentAmount;

                // Calcular data de vencimento para esta parcela
                const dueDate = new Date(firstDueDate);
                if (i > 1) {
                    dueDate.setDate(firstDueDate.getDate() + ((i - 1) * (paymentMethod.days_between_installments || 30)));
                }

                const installmentData = {
                    payment_id: data.payment_id,
                    installment_number: `${i}/${totalInstallments}`,
                    due_date: dueDate,
                    amount: installmentAmount,
                    balance: installmentAmount,
                    status: 'Pendente',
                    account_entry_id: paymentMethod.account_entry_id
                };

                const installment = await this.createInstallment(installmentData);
                installments.push(installment);

                logger.info('✅ [INSTALLMENT-CREATED] Parcela criada', {
                    installment_id: installment.installment_id,
                    installment_number: installment.installment_number,
                    amount: installment.amount,
                    balance: installment.balance,
                    status: installment.status
                });
            }

            logger.info('🟢 [INSTALLMENTS-GENERATE-SUCCESS] Parcelas geradas', { 
                payment_id: data.payment_id,
                installments_count: installments.length
            });

            return installments;
        } catch (error) {
            logger.error('🔴 [INSTALLMENTS-GENERATE-ERROR] Erro ao gerar parcelas', { 
                error: error.message, 
                stack: error.stack,
                data
            });
            throw error;
        }
    }

    async createInstallment(data) {
        try {
            logger.info('🔄 [INSTALLMENT-CREATE-START] Criando parcela', { data });

            const installment = await this.prisma.installments.create({
                data: data
            });

            logger.info('🟢 [INSTALLMENT-CREATE-SUCCESS] Parcela criada', { 
                installment_id: installment.installment_id
            });

            return installment;
        } catch (error) {
            logger.error('🔴 [INSTALLMENT-CREATE-ERROR] Erro ao criar parcela', { 
                error: error.message, 
                stack: error.stack,
                data
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

    async createMovementPaymentWithInstallments(data) {
        try {
            logger.info('🔄 [MOVEMENT-PAYMENT-CREATE-START] Criando pagamento de movimento com parcelas', { 
                movement_id: data.movement_id,
                payment_method_id: data.payment_method_id,
                total_amount: data.total_amount,
                movement_date: data.movement_date
            });

            // Verificar se já existe pagamento para este movimento
            const existingPayments = await this.prisma.movement_payments.findMany({
                where: { 
                    movement_id: data.movement_id,
                    deleted_at: null // Apenas pagamentos não deletados
                },
                include: {
                    installments: true
                }
            });

            if (existingPayments && existingPayments.length > 0) {
                logger.warn('⚠️ [MOVEMENT-PAYMENT-ALREADY-EXISTS] Já existe um pagamento para este movimento', {
                    movement_id: data.movement_id,
                    existing_payment_ids: existingPayments.map(p => p.payment_id)
                });
                return {
                    movementPayment: existingPayments[0],
                    installments: existingPayments[0].installments || []
                };
            }

            // Iniciar transação
            const result = await this.prisma.$transaction(async (prisma) => {
                // Criar pagamento de movimento
                const movementPayment = await prisma.movement_payments.create({
                    data: {
                        movement_id: data.movement_id,
                        payment_method_id: data.payment_method_id,
                        total_amount: data.total_amount,
                        status: 'Pendente'
                    }
                });

                logger.info('✅ [MOVEMENT-PAYMENT-CREATED] Pagamento de movimento criado', {
                    payment_id: movementPayment.payment_id
                });

                // Gerar parcelas
                const installments = await this.generateInstallments({
                    payment_id: movementPayment.payment_id,
                    payment_method_id: data.payment_method_id,
                    total_amount: data.total_amount,
                    movement_date: data.movement_date
                });

                logger.info('🟢 [MOVEMENT-PAYMENT-CREATE-SUCCESS] Pagamento de movimento criado com parcelas', { 
                    payment_id: movementPayment.payment_id,
                    installments_count: installments.length
                });

                return {
                    movementPayment,
                    installments
                };
            });

            return result;
        } catch (error) {
            logger.error('🔴 [MOVEMENT-PAYMENT-CREATE-ERROR] Erro ao criar pagamento de movimento com parcelas', { 
                error: error.message, 
                stack: error.stack,
                data 
            });
            throw error;
        }
    }
}

module.exports = PrismaMovementPaymentRepository;
