class ItemResponseDTO {
    constructor(data) {
        this.item_id = data.item_id;
        this.code = data.code;
        this.name = data.name;
        this.description = data.description;
        this.price = data.price;
        this.active = data.active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static fromEntity(entity) {
        return new ItemResponseDTO(entity);
    }

    static fromEntities(entities) {
        return entities.map(entity => ItemResponseDTO.fromEntity(entity));
    }
}

module.exports = ItemResponseDTO;
