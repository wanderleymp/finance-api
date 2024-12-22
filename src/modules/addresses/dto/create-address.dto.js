class CreateAddressDTO {
    constructor(data) {
        this.person_id = data.person_id;
        this.street = data.street || '';
        this.number = data.number || '';
        this.complement = data.complement || null;
        this.neighborhood = data.neighborhood || '';
        this.city = data.city || '';
        this.state = data.state ? data.state.toUpperCase() : '';
        this.postal_code = data.postal_code || '';
        this.country = data.country || 'Brasil';
        this.reference = data.reference || null;
        this.ibge = data.ibge || null;
    }

    validate(schema) {
        return schema.validateCreate(this);
    }
}

module.exports = CreateAddressDTO;
