const PersonDetailsResponseDTO = require('../../persons/dto/person-response.dto').PersonDetailsResponseDTO;

class BoletoDTO {
    constructor(data) {
        this.boleto_id = data.boleto_id;
        this.status = data.status;
        this.generated_at = data.generated_at;
        this.boleto_number = data.boleto_number;
        this.boleto_url = data.boleto_url;
    }
}

class MovementPaymentDTO {
    constructor(data) {
        this.movement_payment_id = data.movement_payment_id;
        this.movement_id = data.movement_id;
        this.payment_method = data.payment_method;
        this.amount = data.amount;
        this.status = data.status;
        this.payment_date = data.payment_date;
    }
}

class InstallmentResponseDTO {
    constructor(data) {
        this.installment_id = data.installment_id;
        this.payment_id = data.payment_id;
        this.account_entry_id = data.account_entry_id;
        this.installment_number = data.installment_number;
        this.due_date = data.due_date;
        this.expected_date = data.expected_date;
        this.amount = data.amount;
        this.balance = data.balance;
        this.status = data.status;
        this.full_name = data.full_name;
        this.movement_id = data.movement_id;
        this.movement_status_id = data.movement_status_id;

        // Calcula dias em atraso ou adiantamento
        const dueDate = new Date(this.due_date);
        const today = new Date();
        const timeDiff = today.getTime() - dueDate.getTime();
        this.days_overdue = Math.floor(timeDiff / (1000 * 3600 * 24));

        // Adiciona boletos
        this.boletos = [];

        // Adiciona boleto diretamente se existir
        if (data.boleto_id) {
            this.boletos.push({
                boleto_id: data.boleto_id,
                boleto_number: data.boleto_number,
                boleto_url: data.boleto_url,
                status: data.boleto_status,
                generated_at: data.boleto_generated_at
            });
        }

        // Se já existirem boletos, adiciona
        if (Array.isArray(data.boletos)) {
            this.boletos = [
                ...this.boletos, 
                ...data.boletos.map(boleto => ({
                    boleto_id: boleto.boleto_id,
                    boleto_number: boleto.boleto_number,
                    boleto_url: boleto.boleto_url,
                    status: boleto.status,
                    generated_at: boleto.generated_at
                }))
            ];
        }

        // Inclui pagamentos se existirem
        if (data.movement_payments) {
            this.movement_payments = data.movement_payments.map(payment => new MovementPaymentDTO(payment));
        }

        // Inclui pessoa se existir
        if (data.person) {
            this.person = new PersonDetailsResponseDTO(data.person);
        }
    }

    calculateDaysOverdue(due_date) {
        const dueDate = new Date(due_date);
        const today = new Date();
        const timeDiff = today.getTime() - dueDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        return daysDiff > 0 ? daysDiff : -1;
    }
}

module.exports = InstallmentResponseDTO;
