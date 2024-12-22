class UpdateItemDTO {
    constructor(data) {
        if (data.name !== undefined) this.name = data.name;
        if (data.description !== undefined) this.description = data.description;
        if (data.category !== undefined) this.category = data.category;
        if (data.price !== undefined) this.price = data.price;
        if (data.stock_quantity !== undefined) this.stock_quantity = data.stock_quantity;
        if (data.unit !== undefined) this.unit = data.unit;
        if (data.is_active !== undefined) this.is_active = data.is_active;
    }

    validate() {
        if (this.name !== undefined && (typeof this.name !== 'string' || this.name.length < 3)) {
            throw new Error('Nome deve ter pelo menos 3 caracteres');
        }
        if (this.price !== undefined && (typeof this.price !== 'number' || this.price <= 0)) {
            throw new Error('Preço deve ser maior que zero');
        }
        if (Object.keys(this).length === 0) {
            throw new Error('Pelo menos um campo deve ser fornecido para atualização');
        }
    }
}

module.exports = UpdateItemDTO;
