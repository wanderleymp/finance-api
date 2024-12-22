class AddressResponseDTO {
    constructor(data) {
        this.id = data.id || data.address_id;
        this.person_id = data.person_id;
        this.street = data.street;
        this.number = data.number;
        this.complement = data.complement;
        this.neighborhood = data.neighborhood;
        this.city = data.city;
        this.state = data.state;
        this.postal_code = this.formatPostalCode(data.postal_code);
        this.country = data.country || 'Brasil';
        this.reference = data.reference;
        this.ibge = data.ibge;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    formatPostalCode(code) {
        if (!code) return null;
        const cleaned = code.replace(/[^\d]/g, '');
        return cleaned.length === 8 
            ? `${cleaned.slice(0,5)}-${cleaned.slice(5)}` 
            : cleaned;
    }

    static fromDatabase(data) {
        return new AddressResponseDTO(data);
    }
}

module.exports = AddressResponseDTO;
