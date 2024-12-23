class MovementItemDTO {
    constructor(data) {
        this.movement_item_id = data.movement_item_id;
        this.movement_id = data.movement_id;
        this.item_id = data.item_id;
        this.item_name = data.item_name;
        this.quantity = data.quantity;
        this.unit_price = data.unit_price;
        this.total_price = data.total_price;
        this.description = data.description;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static fromDatabase(data) {
        return new MovementItemDTO(data);
    }

    static fromEntity(entity) {
        return new MovementItemDTO(entity);
    }

    toEntity() {
        return {
            movement_item_id: this.movement_item_id,
            movement_id: this.movement_id,
            item_id: this.item_id,
            item_name: this.item_name,
            quantity: this.quantity,
            unit_price: this.unit_price,
            total_price: this.total_price,
            description: this.description,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = MovementItemDTO;
