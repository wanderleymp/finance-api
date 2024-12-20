const { ValidationHelper } = require('../utils/validationHelper');

const INSTALLMENT_STATUS = ['PENDING', 'PAID', 'CANCELLED', 'OVERDUE'];

class InstallmentValidations {
    /**
     * Regras de validação para parcela
     */
    static installmentRules = {
        value: {
            required: true,
            type: 'number',
            options: { min: 0.01 }
        },
        due_date: {
            required: true,
            type: 'date',
            options: { min: new Date() }
        },
        status: {
            required: true,
            type: 'enum',
            values: INSTALLMENT_STATUS
        },
        installment_number: {
            required: true,
            type: 'number',
            options: { integer: true, min: 1 }
        },
        movement_id: {
            required: true,
            type: 'number',
            options: { integer: true, min: 1 }
        }
    };

    /**
     * Regras de validação para atualização de parcela
     */
    static updateRules = {
        value: {
            type: 'number',
            options: { min: 0.01 }
        },
        due_date: {
            type: 'date',
            options: { min: new Date() }
        },
        status: {
            type: 'enum',
            values: INSTALLMENT_STATUS
        }
    };

    /**
     * Valida dados de parcela
     * @param {Object} installment - Dados da parcela
     * @throws {ValidationError} Se os dados forem inválidos
     */
    static validateInstallment(installment) {
        ValidationHelper.validate(installment, this.installmentRules);
    }

    /**
     * Valida dados para atualização de parcela
     * @param {Object} installment - Dados da parcela
     * @throws {ValidationError} Se os dados forem inválidos
     */
    static validateInstallmentUpdate(installment) {
        ValidationHelper.validate(installment, this.updateRules);
    }

    /**
     * Valida atualização de status
     * @param {string} status - Novo status
     * @param {string} currentStatus - Status atual
     * @throws {ValidationError} Se a transição de status for inválida
     */
    static validateStatusUpdate(status, currentStatus) {
        // Valida status
        ValidationHelper.validateEnum(status, INSTALLMENT_STATUS, 'status');

        // Valida transições permitidas
        const allowedTransitions = {
            PENDING: ['PAID', 'CANCELLED', 'OVERDUE'],
            PAID: [],
            CANCELLED: [],
            OVERDUE: ['PAID', 'CANCELLED']
        };

        const allowed = allowedTransitions[currentStatus] || [];
        if (!allowed.includes(status)) {
            throw new ValidationError(
                'Transição de status inválida',
                [`Não é permitido alterar status de ${currentStatus} para ${status}`]
            );
        }
    }

    /**
     * Valida parcelamento
     * @param {Object} movement - Dados do movimento
     * @param {Object[]} installments - Array de parcelas
     * @throws {ValidationError} Se os dados forem inválidos
     */
    static validateInstallments(movement, installments) {
        if (!Array.isArray(installments)) {
            throw new ValidationError('Parcelas inválidas', ['Parcelas deve ser um array']);
        }

        if (installments.length === 0) {
            throw new ValidationError('Parcelas inválidas', ['Deve haver pelo menos uma parcela']);
        }

        // Valida cada parcela
        installments.forEach((installment, index) => {
            try {
                this.validateInstallment(installment);
            } catch (error) {
                if (error instanceof ValidationError) {
                    throw new ValidationError(
                        `Parcela ${index + 1} inválida`,
                        error.errors
                    );
                }
                throw error;
            }
        });

        // Valida números das parcelas
        const numbers = installments.map(i => i.installment_number);
        const uniqueNumbers = new Set(numbers);
        if (uniqueNumbers.size !== installments.length) {
            throw new ValidationError(
                'Números de parcelas inválidos',
                ['Números das parcelas devem ser únicos']
            );
        }

        // Valida valor total das parcelas
        const totalInstallments = installments.reduce((sum, i) => sum + i.value, 0);
        if (Math.abs(totalInstallments - movement.value) > 0.01) {
            throw new ValidationError(
                'Valor total das parcelas inválido',
                ['Soma das parcelas deve ser igual ao valor do movimento']
            );
        }

        // Valida ordem das datas
        let previousDate = null;
        installments
            .sort((a, b) => a.installment_number - b.installment_number)
            .forEach((installment, index) => {
                const currentDate = new Date(installment.due_date);
                if (previousDate && currentDate <= previousDate) {
                    throw new ValidationError(
                        'Datas das parcelas inválidas',
                        [`Data da parcela ${index + 1} deve ser posterior à parcela ${index}`]
                    );
                }
                previousDate = currentDate;
            });
    }
}

module.exports = InstallmentValidations;
