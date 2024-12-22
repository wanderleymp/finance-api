class UpdateAddressDTO {
    constructor(data) {
        this.person_id = data.person_id;
        this.street = data.street;
        this.number = data.number;
        this.complement = data.complement || null;
        this.neighborhood = data.neighborhood;
        this.city = data.city;
        this.state = data.state ? data.state.toUpperCase() : undefined;
        this.postal_code = data.postal_code ? data.postal_code.replace(/[^\d]/g, '') : undefined;
        this.country = data.country;
        this.reference = data.reference;
        this.ibge = data.ibge;
        this.is_main = data.is_main;
    }

    validate(schema) {
        return schema.validateUpdate(this);
    }
}

module.exports = UpdateAddressDTO;
