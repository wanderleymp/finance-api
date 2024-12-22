class PersonResponseDTO {
    constructor(data) {
        this.id = data.person_id;
        this.name = data.full_name;
        this.fantasy_name = data.fantasy_name;
        this.birth_date = data.birth_date;
        this.type = data.person_type;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.addresses = data.addresses || [];
        this.contacts = data.contacts || [];
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            fantasy_name: this.fantasy_name,
            birth_date: this.birth_date,
            type: this.type,
            created_at: this.created_at,
            updated_at: this.updated_at,
            addresses: this.addresses,
            contacts: this.contacts
        };
    }

    static fromDatabase(data) {
        return new PersonResponseDTO({
            person_id: data.person_id,
            full_name: data.full_name,
            fantasy_name: data.fantasy_name,
            birth_date: data.birth_date,
            person_type: data.person_type,
            created_at: data.created_at,
            updated_at: data.updated_at,
            addresses: data.addresses,
            contacts: data.contacts
        });
    }
}

module.exports = PersonResponseDTO;
