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

        // Calcula dias em atraso ou adiantamento
        const currentDate = new Date('2025-01-01T10:40:07Z');
        const expectedDate = new Date(this.expected_date);
        
        const timeDiff = currentDate.getTime() - expectedDate.getTime();
        this.days_overdue = Math.floor(timeDiff / (1000 * 3600 * 24));

        // Inclui boletos se existirem
        if (data.boletos) {
            this.boletos = data.boletos.map(boleto => new BoletoDTO(boleto));
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
}

module.exports = InstallmentResponseDTO;
