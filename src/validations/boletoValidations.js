const { ValidationHelper } = require('../utils/validationHelper');

const BOLETO_STATUS = ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED'];

class BoletoValidations {
    /**
     * Regras de validação para boleto
     */
    static boletoRules = {
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
            values: BOLETO_STATUS
        },
        barcode: {
            required: true,
            custom: (value) => {
                if (!/^\d{44}$/.test(value)) {
                    throw new Error('Código de barras deve ter 44 dígitos numéricos');
                }
            }
        },
        payer_document: {
            required: true,
            type: 'document'
        },
        payer_name: {
            required: true,
            custom: (value) => {
                if (value.length < 3 || value.length > 100) {
                    throw new Error('Nome do pagador deve ter entre 3 e 100 caracteres');
                }
            }
        },
        movement_id: {
            required: true,
            type: 'number',
            options: { integer: true, min: 1 }
        }
    };

    /**
     * Regras de validação para atualização de boleto
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
            values: BOLETO_STATUS
        },
        payer_document: {
            type: 'document'
        },
        payer_name: {
            custom: (value) => {
                if (value && (value.length < 3 || value.length > 100)) {
                    throw new Error('Nome do pagador deve ter entre 3 e 100 caracteres');
                }
            }
        }
    };

    /**
     * Valida dados de boleto
     * @param {Object} boleto - Dados do boleto
     * @throws {ValidationError} Se os dados forem inválidos
     */
    static validateBoleto(boleto) {
        ValidationHelper.validate(boleto, this.boletoRules);
    }

    /**
     * Valida dados para atualização de boleto
     * @param {Object} boleto - Dados do boleto
     * @throws {ValidationError} Se os dados forem inválidos
     */
    static validateBoletoUpdate(boleto) {
        ValidationHelper.validate(boleto, this.updateRules);
    }

    /**
     * Valida atualização de status
     * @param {string} status - Novo status
     * @param {string} currentStatus - Status atual
     * @throws {ValidationError} Se a transição de status for inválida
     */
    static validateStatusUpdate(status, currentStatus) {
        // Valida status
        ValidationHelper.validateEnum(status, BOLETO_STATUS, 'status');

        // Valida transições permitidas
        const allowedTransitions = {
            PENDING: ['PAID', 'CANCELLED', 'EXPIRED'],
            PAID: [],
            CANCELLED: [],
            EXPIRED: ['PAID', 'CANCELLED']
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
     * Valida vários boletos
     * @param {Object[]} boletos - Array de boletos
     * @throws {ValidationError} Se algum boleto for inválido
     */
    static validateMany(boletos) {
        if (!Array.isArray(boletos)) {
            throw new ValidationError('Boletos inválidos', ['Boletos deve ser um array']);
        }

        if (boletos.length === 0) {
            throw new ValidationError('Boletos inválidos', ['Deve haver pelo menos um boleto']);
        }

        boletos.forEach((boleto, index) => {
            try {
                this.validateBoleto(boleto);
            } catch (error) {
                if (error instanceof ValidationError) {
                    throw new ValidationError(
                        `Boleto ${index + 1} inválido`,
                        error.errors
                    );
                }
                throw error;
            }
        });
    }
}

module.exports = BoletoValidations;
