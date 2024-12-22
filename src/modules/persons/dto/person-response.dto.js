class PersonResponseDTO {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.document = data.document;
        this.email = data.email;
        this.birth_date = data.birth_date;
        this.type = data.type;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.addresses = data.addresses || [];
        this.contacts = data.contacts || [];
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            document: this.document,
            email: this.email,
            birth_date: this.birth_date,
            type: this.type,
            is_active: this.is_active,
            created_at: this.created_at,
            updated_at: this.updated_at,
            addresses: this.addresses,
            contacts: this.contacts
        };
    }

    static fromDatabase(data) {
        return new PersonResponseDTO({
            id: data.id,
            name: data.name,
            document: data.document,
            email: data.email,
            birth_date: data.birth_date,
            type: data.type,
            is_active: data.is_active,
            created_at: data.created_at,
            updated_at: data.updated_at,
            addresses: data.addresses,
            contacts: data.contacts
        });
    }
}

module.exports = PersonResponseDTO;
