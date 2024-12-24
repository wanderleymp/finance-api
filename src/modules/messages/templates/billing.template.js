const { formatCurrency, formatDate } = require('../../../utils/formatters');

class BillingMessageTemplate {
    static generate(data) {
        const {
            personName,
            documentNumber,
            amount,
            dueDate,
            invoiceNumber,
            paymentLink
        } = data;

        return `Olá ${personName},

Sua fatura #${invoiceNumber} foi gerada:

Valor: ${formatCurrency(amount)}
Vencimento: ${formatDate(dueDate)}
Documento: ${documentNumber}

Para pagar agora, acesse: ${paymentLink}

Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.

Atenciosamente,
Equipe Financeiro`;
    }

    static validate(data) {
        const required = ['personName', 'documentNumber', 'amount', 'dueDate', 'invoiceNumber', 'paymentLink'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            throw new Error(`Campos obrigatórios faltando: ${missing.join(', ')}`);
        }
    }
}

module.exports = BillingMessageTemplate;
