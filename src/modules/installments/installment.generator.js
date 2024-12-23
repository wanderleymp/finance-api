const { logger } = require('../../middlewares/logger');

class InstallmentGenerator {
    constructor(installmentRepository) {
        this.installmentRepository = installmentRepository;
    }

    /**
     * Gera parcelas para um pagamento baseado no método de pagamento
     */
    async generateInstallments(payment, paymentMethod) {
        try {
            logger.info('Generator: Iniciando geração de parcelas', {
                payment_id: payment.payment_id,
                payment_method_id: paymentMethod.payment_method_id,
                payment_method: paymentMethod
            });

            // Número de parcelas vem do método de pagamento
            const numberOfInstallments = paymentMethod.installment_count;
            
            logger.info('Generator: Calculando valores das parcelas', {
                total_amount: payment.total_amount,
                number_of_installments: numberOfInstallments
            });

            // Calcula o valor de cada parcela
            const installmentAmount = Number((payment.total_amount / numberOfInstallments).toFixed(2));
            
            // Ajusta o valor da última parcela para compensar possíveis diferenças de arredondamento
            const lastInstallmentAdjustment = Number((payment.total_amount - (installmentAmount * numberOfInstallments)).toFixed(2));

            logger.info('Generator: Valores calculados', {
                installment_amount: installmentAmount,
                last_installment_adjustment: lastInstallmentAdjustment
            });

            // Gera as datas de vencimento baseado na configuração do método de pagamento
            const installments = [];
            const baseDate = new Date();

            for (let i = 0; i < numberOfInstallments; i++) {
                const dueDate = new Date(baseDate);
                // Primeira parcela vence em first_due_date_days, as próximas a cada days_between_installments
                const daysToAdd = i === 0 
                    ? paymentMethod.first_due_date_days 
                    : paymentMethod.first_due_date_days + (paymentMethod.days_between_installments * i);
                dueDate.setDate(dueDate.getDate() + daysToAdd);

                // Se for a última parcela, ajusta o valor
                const amount = i === numberOfInstallments - 1 
                    ? installmentAmount + lastInstallmentAdjustment 
                    : installmentAmount;

                const installment = {
                    payment_id: payment.payment_id,
                    installment_number: String(i + 1).padStart(2, '0'),
                    amount: amount,
                    balance: amount,
                    due_date: dueDate,
                    status: 'PENDING',
                    account_entry_id: paymentMethod.account_entry_id
                };

                logger.info('Generator: Criando parcela', { installment });
                
                try {
                    const createdInstallment = await this.installmentRepository.create(installment);
                    logger.info('Generator: Parcela criada com sucesso', { createdInstallment });
                    installments.push(createdInstallment);
                } catch (error) {
                    logger.error('Generator: Erro ao criar parcela individual', {
                        error: error.message,
                        error_stack: error.stack,
                        installment
                    });
                    throw error;
                }
            }

            logger.info('Generator: Parcelas geradas com sucesso', {
                payment_id: payment.payment_id,
                installments_count: installments.length,
                installments: installments
            });

            return installments;
        } catch (error) {
            logger.error('Generator: Erro ao gerar parcelas', {
                error: error.message,
                error_stack: error.stack,
                payment_id: payment.payment_id,
                payment_method_id: paymentMethod.payment_method_id
            });
            throw error;
        }
    }
}

module.exports = InstallmentGenerator;
