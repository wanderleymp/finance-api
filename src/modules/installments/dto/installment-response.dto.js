class BoletoDTO {
    constructor(data) {
        this.boleto_id = data.boleto_id;
        this.status = data.status;
        this.generated_at = data.generated_at;
        this.boleto_number = data.boleto_number;
    }
}

class InstallmentResponseDTO {
    constructor(data) {
        this.installment_id = data.installment_id;
        this.payment_id = data.payment_id;
        this.due_date = data.due_date;
        this.amount = data.amount;
        this.status = data.status;
        this.payment_date = data.payment_date;
        this.installment_number = data.installment_number;
        this.total_installments = data.total_installments;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;

        // Inclui boletos se existirem
        if (data.boletos) {
            this.boletos = data.boletos.map(boleto => new BoletoDTO(boleto));
        }
    }
}

module.exports = InstallmentResponseDTO;
