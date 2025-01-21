const { logger } = require('../../middlewares/logger');

class InstallmentGenerator {
    constructor(installmentRepository, boletoService) {
        this.installmentRepository = installmentRepository;
        this.boletoService = boletoService;
        this.logger = logger;
    }

    /**
     * Gera parcelas para um pagamento baseado no método de pagamento
     */
    async generateInstallments(payment, paymentMethod, baseDueDate = null, generateBoleto = true) {
        try {
            this.logger.info('Generator: Iniciando geração de parcelas', {
                payment_id: payment.payment_id,
                payment_method_id: paymentMethod.payment_method_id,
                payment_method: paymentMethod,
                baseDueDate: baseDueDate,
                generateBoleto
            });

            // Número de parcelas vem do método de pagamento
            const numberOfInstallments = paymentMethod.installment_count;
            
            this.logger.info('Generator: Calculando valores das parcelas', {
                total_amount: payment.total_amount,
                number_of_installments: numberOfInstallments
            });

            // Calcula o valor de cada parcela
            const installmentAmount = Number((payment.total_amount / numberOfInstallments).toFixed(2));
            
            // Ajusta o valor da última parcela para compensar possíveis diferenças de arredondamento
            const lastInstallmentAdjustment = Number((payment.total_amount - (installmentAmount * numberOfInstallments)).toFixed(2));

            this.logger.info('Generator: Valores calculados', {
                installment_amount: installmentAmount,
                last_installment_adjustment: lastInstallmentAdjustment
            });

            // Gera as datas de vencimento
            const installments = [];
            
            // Usar baseDueDate se fornecido, senão usar data atual
            const baseDate = baseDueDate ? new Date(baseDueDate) : new Date();

            for (let i = 0; i < numberOfInstallments; i++) {
                const dueDate = new Date(baseDate);
                
                // Se baseDueDate foi fornecido, usar intervalos mensais
                if (baseDueDate) {
                    dueDate.setMonth(dueDate.getMonth() + i);
                } else {
                    // Senão, usar lógica original de dias
                    const daysToAdd = i === 0 
                        ? paymentMethod.first_due_date_days 
                        : paymentMethod.first_due_date_days + (paymentMethod.days_between_installments * i);
                    dueDate.setDate(dueDate.getDate() + daysToAdd);
                }

                this.logger.info('Generator: Criando parcela', {
                    installmentNumber: i + 1,
                    dueDate: dueDate.toISOString(),
                    amount: i === numberOfInstallments - 1 
                        ? installmentAmount + lastInstallmentAdjustment 
                        : installmentAmount
                });

                // Se for a última parcela, ajusta o valor
                const installment = {
                    account_entry_id: paymentMethod.account_entry_id,
                    amount: i === numberOfInstallments - 1 
                        ? installmentAmount + lastInstallmentAdjustment 
                        : installmentAmount,
                    balance: i === numberOfInstallments - 1 
                        ? installmentAmount + lastInstallmentAdjustment 
                        : installmentAmount,
                    due_date: dueDate.toISOString().split('T')[0],
                    installment_number: String(i + 1).padStart(2, '0'),
                    payment_id: payment.payment_id,
                    status: 'PENDING'
                };

                this.logger.info('Generator: Criando parcela', { installment });
                
                try {
                    const createdInstallment = await this.installmentRepository.create(installment);
                    this.logger.info('Generator: Parcela criada com sucesso', { createdInstallment });

                    // Se for pagamento via boleto e generateBoleto for true, gera o boleto
                    if (paymentMethod.payment_document_type_id === 1 && generateBoleto) {
                        try {
                            const boletoData = {
                                installment_id: createdInstallment.installment_id,
                                amount: createdInstallment.amount,
                                due_date: createdInstallment.due_date,
                                payer_id: payment.person_id,
                                description: payment.description,
                                status: 'A_EMITIR'
                            };
                            
                            this.logger.info('Generator: Gerando boleto', { boletoData });
                            
                            await this.boletoService.createBoleto(boletoData);
                            
                            this.logger.info('Generator: Boleto gerado com sucesso', { 
                                installment_id: createdInstallment.installment_id 
                            });
                        } catch (error) {
                            this.logger.error('Generator: Erro ao gerar boleto', {
                                error: error.message,
                                error_stack: error.stack,
                                installment_id: createdInstallment.installment_id
                            });
                            // Não lançamos o erro para não impedir a criação das outras parcelas
                            // O boleto poderá ser gerado depois manualmente
                        }
                    }

                    installments.push(createdInstallment);
                } catch (error) {
                    this.logger.error('Generator: Erro ao criar parcela individual', {
                        error: error.message,
                        error_stack: error.stack,
                        installment
                    });
                    throw error;
                }
            }

            this.logger.info('Generator: Parcelas geradas com sucesso', {
                payment_id: payment.payment_id,
                installments_count: installments.length,
                installments: installments
            });

            return installments;
        } catch (error) {
            this.logger.error('Generator: Erro ao gerar parcelas', {
                error: error.message,
                error_stack: error.stack,
                payment_id: payment.payment_id,
                payment_method_id: paymentMethod.payment_method_id
            });
            throw error;
        }
    }

    async generateInstallmentsWithTransaction(client, payment, paymentMethod) {
        try {
            this.logger.info('Generator: Iniciando geração de parcelas com transação', {
                payment_id: payment.payment_id,
                payment_method_id: paymentMethod.data.payment_method_id,
                payment_method: paymentMethod.data
            });

            // Número de parcelas vem do método de pagamento
            const numberOfInstallments = paymentMethod.data.installment_count;
            
            this.logger.info('Generator: Calculando valores das parcelas', {
                total_amount: payment.total_amount,
                number_of_installments: numberOfInstallments
            });

            // Calcula o valor de cada parcela
            const installmentAmount = Number((payment.total_amount / numberOfInstallments).toFixed(2));
            
            // Ajusta o valor da última parcela para compensar possíveis diferenças de arredondamento
            const lastInstallmentAdjustment = Number((payment.total_amount - (installmentAmount * numberOfInstallments)).toFixed(2));

            this.logger.info('Generator: Valores calculados', {
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
                    ? paymentMethod.data.first_due_date_days 
                    : paymentMethod.data.first_due_date_days + (paymentMethod.data.days_between_installments * i);
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
                    account_entry_id: paymentMethod.data.account_entry_id
                };

                this.logger.info('Generator: Criando parcela', { installment });
                
                try {
                    const createdInstallment = await this.installmentRepository.createWithClient(client, installment);
                    this.logger.info('Generator: Parcela criada com sucesso', { createdInstallment });

                    // Se for pagamento via boleto, gera o boleto
                    if (paymentMethod.data.payment_document_type_id === 1) {
                        try {
                            const boletoData = {
                                installment_id: createdInstallment.installment_id,
                                amount: createdInstallment.amount,
                                due_date: createdInstallment.due_date,
                                payer_id: payment.person_id,
                                description: payment.description,
                                status: 'A_EMITIR'
                            };
                            
                            this.logger.info('Generator: Gerando boleto', { boletoData });
                            
                            await this.boletoService.createBoleto(boletoData);
                            
                            this.logger.info('Generator: Boleto gerado com sucesso', { 
                                installment_id: createdInstallment.installment_id 
                            });
                        } catch (error) {
                            this.logger.error('Generator: Erro ao gerar boleto', {
                                error: error.message,
                                error_stack: error.stack,
                                installment_id: createdInstallment.installment_id
                            });
                            // Não lançamos o erro para não impedir a criação das outras parcelas
                            // O boleto poderá ser gerado depois manualmente
                        }
                    }

                    installments.push(createdInstallment);
                } catch (error) {
                    this.logger.error('Generator: Erro ao criar parcela individual', {
                        error: error.message,
                        error_stack: error.stack,
                        installment
                    });
                    throw error;
                }
            }

            return installments;
        } catch (error) {
            this.logger.error('Generator: Erro ao gerar parcelas', {
                error: error.message,
                error_stack: error.stack,
                payment_id: payment.payment_id
            });
            throw error;
        }
    }
}

module.exports = InstallmentGenerator;
