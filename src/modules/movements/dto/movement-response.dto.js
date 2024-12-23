class BoletoDTO {
    constructor(data) {
        this.boleto_id = data.boleto_id;
        this.status = data.status;
        this.generated_at = data.generated_at;
        this.boleto_number = data.boleto_number;
    }
}

class InstallmentDTO {
    constructor(data) {
        this.installment_id = data.installment_id;
        this.payment_id = data.payment_id;
        this.due_date = data.due_date;
        this.amount = data.amount;
        this.status = data.status;
        this.installment_number = data.installment_number;

        // Inclui boletos se existirem
        if (data.boletos) {
            this.boletos = data.boletos.map(boleto => new BoletoDTO(boleto));
        }
    }
}

class PaymentDTO {
    constructor(data) {
        this.payment_id = data.payment_id;
        this.movement_id = data.movement_id;
        this.payment_type = data.payment_type;
        this.total_amount = data.total_amount;
        this.installments_number = data.installments_number;
        this.created_at = data.created_at;

        // Inclui parcelas se existirem
        if (data.installments) {
            this.installments = data.installments.map(installment => new InstallmentDTO(installment));
        }
    }
}

class MovementResponseDTO {
    constructor(data) {
        this.movement_id = data.movement_id;
        this.person_id = data.person_id;
        this.person_name = data.person_name;
        this.person_document = data.person_document;
        this.movement_type_id = data.movement_type_id;
        this.movement_type_name = data.movement_type_name;
        this.movement_status_id = data.movement_status_id;
        this.movement_status_name = data.movement_status_name;
        this.description = data.description;
        this.total_amount = data.total_amount;
        this.movement_date = data.movement_date;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;

        // Inclui pagamentos se existirem
        if (data.payments) {
            this.payments = data.payments.map(payment => new PaymentDTO(payment));
        }
    }
}

module.exports = MovementResponseDTO;
