const { ValidationHelper } = require('../utils/validationHelper');

const MOVEMENT_STATUS = ['PENDING', 'PAID', 'CANCELLED', 'OVERDUE'];
const MOVEMENT_TYPES = ['INCOME', 'EXPENSE', 'TRANSFER'];
const PAYMENT_TYPES = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_SLIP', 'PIX'];
const PAYMENT_STATUS = ['PENDING', 'PAID', 'CANCELLED', 'FAILED'];

class MovementValidations {
    /**
     * Regras de validação para movimento
     */
    static movementRules = {
        description: {
            required: true,
            type: 'string',
            options: { minLength: 3, maxLength: 255 }
        },
        value: {
            required: true,
            type: 'number',
            options: { min: 0.01 }
        },
        type: {
            required: true,
            type: 'enum',
            values: MOVEMENT_TYPES
        },
        status: {
            required: true,
            type: 'enum',
            values: MOVEMENT_STATUS
        },
        due_date: {
            required: true,
            type: 'date',
            options: { min: new Date() }
        },
        person_id: {
            required: true,
            type: 'number',
            options: { integer: true, min: 1 }
        }
    };

    /**
     * Regras de validação para pagamento
     */
    static paymentRules = {
        value: {
            required: true,
            type: 'number',
            options: { min: 0.01 }
        },
        payment_type: {
            required: true,
            type: 'enum',
            values: PAYMENT_TYPES
        },
        status: {
            required: true,
            type: 'enum',
            values: PAYMENT_STATUS
        },
        payment_date: {
            type: 'date',
            options: { min: new Date() }
        }
    };

    /**
     * Valida dados de movimento
     * @param {Object} movement - Dados do movimento
     * @throws {ValidationError} Se os dados forem inválidos
     */
    static validateMovement(movement) {
        ValidationHelper.validate(movement, this.movementRules);
    }

    /**
     * Valida dados de pagamento
     * @param {Object} payment - Dados do pagamento
     * @throws {ValidationError} Se os dados forem inválidos
     */
    static validatePayment(payment) {
        ValidationHelper.validate(payment, this.paymentRules);
    }

    /**
     * Valida movimento com pagamentos
     * @param {Object} movement - Dados do movimento
     * @param {Object[]} payments - Array de pagamentos
     * @throws {ValidationError} Se os dados forem inválidos
     */
    static validateMovementWithPayments(movement, payments) {
        // Valida movimento
        this.validateMovement(movement);

        // Valida pagamentos
        if (!Array.isArray(payments)) {
            throw new ValidationError('Pagamentos inválidos', ['Pagamentos deve ser um array']);
        }

        if (payments.length === 0) {
            throw new ValidationError('Pagamentos inválidos', ['Deve haver pelo menos um pagamento']);
        }

        // Valida cada pagamento
        payments.forEach((payment, index) => {
            try {
                this.validatePayment(payment);
            } catch (error) {
                if (error instanceof ValidationError) {
                    throw new ValidationError(
                        `Pagamento ${index + 1} inválido`,
                        error.errors
                    );
                }
                throw error;
            }
        });

        // Valida valor total dos pagamentos
        const totalPayments = payments.reduce((sum, p) => sum + p.value, 0);
        if (totalPayments !== movement.value) {
            throw new ValidationError(
                'Valor total dos pagamentos inválido',
                ['Soma dos pagamentos deve ser igual ao valor do movimento']
            );
        }
    }

    /**
     * Valida atualização de status
     * @param {string} status - Novo status
     * @param {string} currentStatus - Status atual
     * @throws {ValidationError} Se a transição de status for inválida
     */
    static validateStatusUpdate(status, currentStatus) {
        // Valida status
        ValidationHelper.validateEnum(status, MOVEMENT_STATUS, 'status');

        // Valida transições permitidas
        const allowedTransitions = {
            PENDING: ['PAID', 'CANCELLED', 'OVERDUE'],
            PAID: ['CANCELLED'],
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
}

module.exports = MovementValidations;
