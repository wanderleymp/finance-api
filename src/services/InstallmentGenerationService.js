const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');

class InstallmentGenerationService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async generateInstallments(paymentId) {
        try {
            logger.info('[InstallmentGeneration] Iniciando geração de parcelas:', { payment_id: paymentId });

            // Busca os dados do pagamento, movimento e forma de pagamento
            const payment = await this.prisma.movementPayment.findUnique({
                where: { payment_id: paymentId },
                include: {
                    movement: true,
                    paymentMethod: true
                }
            });

            if (!payment) {
                logger.error('[InstallmentGeneration] Pagamento não encontrado:', { payment_id: paymentId });
                throw new Error('Pagamento não encontrado');
            }

            logger.info('[InstallmentGeneration] Dados do pagamento recuperados:', {
                payment_id: payment.payment_id,
                movement_id: payment.movement_id,
                total_amount: payment.total_amount,
                payment_method: payment.paymentMethod.name,
                movement_date: payment.movement.movement_date
            });

            const { movement, paymentMethod } = payment;
            const totalInstallments = paymentMethod.installment_count;

            // Validações
            if (totalInstallments <= 0) {
                logger.error('[InstallmentGeneration] Número de parcelas inválido:', { installment_count: totalInstallments });
                throw new Error('O número de parcelas deve ser maior que zero');
            }

            logger.info('[InstallmentGeneration] Configurações de parcelamento:', {
                total_installments: totalInstallments,
                first_due_date_days: paymentMethod.first_due_date_days,
                days_between: paymentMethod.days_between_installments
            });

            // Calcula o valor de cada parcela (arredondado para duas casas decimais)
            const baseInstallmentAmount = Number((payment.total_amount / totalInstallments).toFixed(2));
            const roundingDifference = Number((payment.total_amount - (baseInstallmentAmount * totalInstallments)).toFixed(2));

            logger.info('[InstallmentGeneration] Valores calculados:', {
                total_amount: payment.total_amount,
                base_installment_amount: baseInstallmentAmount,
                rounding_difference: roundingDifference
            });

            // Define a data da primeira parcela
            let currentDueDate = new Date(movement.movement_date);
            currentDueDate.setDate(currentDueDate.getDate() + paymentMethod.first_due_date_days);

            const installments = [];

            // Gera e insere as parcelas
            for (let i = 1; i <= totalInstallments; i++) {
                const isLastInstallment = i === totalInstallments;
                const installmentAmount = isLastInstallment 
                    ? baseInstallmentAmount + roundingDifference 
                    : baseInstallmentAmount;

                const installmentNumberText = `${i}/${totalInstallments}`;

                logger.info('[InstallmentGeneration] Gerando parcela:', {
                    number: installmentNumberText,
                    amount: installmentAmount,
                    due_date: currentDueDate,
                    is_last: isLastInstallment
                });

                // Cria a parcela
                const installment = await this.prisma.installment.create({
                    data: {
                        payment_id: paymentId,
                        installment_number: installmentNumberText,
                        due_date: currentDueDate,
                        amount: installmentAmount,
                        balance: installmentAmount,
                        status: 'Pendente',
                        account_entry_id: paymentMethod.account_entry_id,
                        movement_id: movement.movement_id
                    }
                });

                logger.info('[InstallmentGeneration] Parcela criada:', {
                    installment_id: installment.installment_id,
                    number: installment.installment_number,
                    amount: installment.amount,
                    due_date: installment.due_date
                });

                installments.push(installment);

                // Atualiza a data de vencimento para a próxima parcela
                currentDueDate = new Date(currentDueDate);
                currentDueDate.setDate(currentDueDate.getDate() + paymentMethod.days_between_installments);
            }

            logger.info('[InstallmentGeneration] Geração concluída com sucesso:', { 
                payment_id: paymentId, 
                total_installments: totalInstallments,
                total_amount: payment.total_amount
            });

            return installments;

        } catch (error) {
            logger.error('[InstallmentGeneration] Erro ao gerar parcelas:', error);
            throw error;
        }
    }
}

module.exports = InstallmentGenerationService;
