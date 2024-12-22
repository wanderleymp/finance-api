class MovementResponseDTO {
    constructor(data) {
        this.movement_id = data.movement_id;
        this.movement_type_id = data.movement_type_id;
        this.movement_status_id = data.movement_status_id;
        this.person_id = data.person_id;
        this.description = data.description;
        this.movement_date = data.movement_date;
        this.total_amount = data.total_amount;
        this.status_name = data.status_name;
        this.type_name = data.type_name;
        this.person_name = data.person_name;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;

        // Dados detalhados
        if (data.person) {
            this.person = data.person;
        }
        if (data.payments) {
            this.payments = data.payments;
        }
        if (data.installments) {
            this.installments = data.installments;
        }
        if (data.total_paid !== undefined) {
            this.total_paid = data.total_paid;
        }
        if (data.remaining_amount !== undefined) {
            this.remaining_amount = data.remaining_amount;
        }
    }
}

module.exports = {
    MovementResponseDTO
};
