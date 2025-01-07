class PersonContactResponseDTO {
    constructor(data) {
        this.person_contact_id = data.person_contact_id;
        this.contact_id = data.contact_id;
        this.contact_value = data.contact_value;
        this.contact_type = data.contact_type;
        this.contact_name = data.contact_name;
        this.created_at = data.created_at;
    }

    toJSON() {
        return {
            person_contact_id: this.person_contact_id,
            contact_id: this.contact_id,
            contact_value: this.contact_value,
            contact_type: this.contact_type,
            contact_name: this.contact_name,
            created_at: this.created_at
        };
    }

    static fromDatabase(data) {
        return new PersonContactResponseDTO(data);
    }
}

module.exports = PersonContactResponseDTO;
