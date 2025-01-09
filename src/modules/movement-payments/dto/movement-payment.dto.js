class InstallmentDTO {
    constructor(data) {
        this.installment_id = data.installment_id;
        this.payment_id = data.payment_id;
        this.installment_number = data.installment_number;
        this.total_installments = data.total_installments;
        this.due_date = data.due_date;
        this.amount = data.amount;
        this.balance = data.balance;
        this.status = data.status;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}

class MovementPaymentResponseDTO {
    constructor(data) {
        this.payment_id = data.payment_id;
        this.movement_id = data.movement_id;
        this.payment_method_id = data.payment_method_id;
        this.total_amount = data.total_amount;
        this.status = data.status;
        this.method_name = data.method_name;
        this.payment_method_type = data.payment_method_type;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;

        // Inclui parcelas se existirem
        if (data.installments) {
            this.installments = data.installments.map(installment => new InstallmentDTO(installment));
        }
    }
}

module.exports = {
    MovementPaymentResponseDTO,
    InstallmentDTO
};
