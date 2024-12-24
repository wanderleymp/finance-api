class PersonResponseDTO {
    constructor(data) {
        this.person_id = data.person_id;
        this.full_name = data.full_name;
        this.fantasy_name = data.fantasy_name;
        this.birth_date = data.birth_date;
        this.type = data.person_type;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    toJSON() {
        return {
            person_id: this.person_id,
            full_name: this.full_name,
            fantasy_name: this.fantasy_name,
            birth_date: this.birth_date,
            type: this.type,
            created_at: this.created_at,
            updated_at: this.updated_at
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
            updated_at: data.updated_at
        });
    }
}

class PersonDetailsResponseDTO extends PersonResponseDTO {
    constructor(data) {
        super(data);
        this.addresses = data.addresses || [];
        this.contacts = data.contacts || [];
        this.documents = data.documents || [];
    }

    toJSON() {
        return {
            ...super.toJSON(),
            addresses: this.addresses,
            contacts: this.contacts,
            documents: this.documents
        };
    }

    static fromDatabase(data) {
        return new PersonDetailsResponseDTO({
            person_id: data.person_id,
            full_name: data.full_name,
            fantasy_name: data.fantasy_name,
            birth_date: data.birth_date,
            person_type: data.person_type,
            created_at: data.created_at,
            updated_at: data.updated_at,
            addresses: data.addresses,
            contacts: data.contacts,
            documents: data.documents
        });
    }
}

module.exports = {
    PersonResponseDTO,
    PersonDetailsResponseDTO
};
