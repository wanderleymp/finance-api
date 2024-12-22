class CreateItemDTO {
    constructor(data) {
        this.name = data.name;
        this.description = data.description;
        this.category = data.category;
        this.price = data.price;
        this.stock_quantity = data.stock_quantity || 0;
        this.unit = data.unit;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
    }

    validate() {
        if (!this.name || typeof this.name !== 'string' || this.name.length < 3) {
            throw new Error('Nome é obrigatório e deve ter pelo menos 3 caracteres');
        }
        if (!this.price || typeof this.price !== 'number' || this.price <= 0) {
            throw new Error('Preço é obrigatório e deve ser maior que zero');
        }
    }
}

module.exports = CreateItemDTO;
