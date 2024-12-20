class InstallmentResponseDTO {
    constructor(data) {
        this.installment_id = data.installment_id;
        this.payment_id = data.payment_id;
        this.installment_number = data.installment_number;
        this.due_date = data.due_date;
        this.amount = data.amount;
        this.balance = data.balance;
        this.status = data.status;
        this.account_entry_id = data.account_entry_id;
        this.expected_date = data.expected_date;
    }
}

module.exports = {
    InstallmentResponseDTO
};
