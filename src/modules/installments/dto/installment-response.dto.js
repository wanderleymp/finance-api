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
    }
}

module.exports = InstallmentResponseDTO;
