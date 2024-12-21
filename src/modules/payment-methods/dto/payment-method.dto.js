class PaymentMethodResponseDTO {
    constructor(data) {
        this.payment_method_id = data.payment_method_id;
        this.method_name = data.method_name;
        this.description = data.description;
        this.has_entry = data.has_entry;
        this.installment_count = data.installment_count;
        this.days_between_installments = data.days_between_installments;
        this.first_due_date_days = data.first_due_date_days;
        this.account_entry_id = data.account_entry_id;
        this.integration_mapping_id = data.integration_mapping_id;
        this.payment_document_type_id = data.payment_document_type_id;
        this.credential_id = data.credential_id;
        this.bank_account_id = data.bank_account_id;
        this.active = data.active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.deleted_at = data.deleted_at;
    }
}

module.exports = {
    PaymentMethodResponseDTO
};
