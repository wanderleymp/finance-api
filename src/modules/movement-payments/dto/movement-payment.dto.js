class MovementPaymentResponseDTO {
    constructor(data) {
        this.payment_id = data.payment_id;
        this.movement_id = data.movement_id;
        this.payment_method_id = data.payment_method_id;
        this.total_amount = data.total_amount;
        this.status = data.status;
        this.method_name = data.method_name;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}

module.exports = {
    MovementPaymentResponseDTO
};
