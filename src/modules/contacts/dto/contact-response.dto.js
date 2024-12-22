class ContactResponseDTO {
    constructor(data) {
        this.id = data.contact_id;
        this.value = data.contact_value;
        this.name = data.contact_name;
        this.type = data.contact_type;
        this.created_at = data.created_at;
    }

    static fromDatabase(data) {
        return new ContactResponseDTO(data);
    }
}

module.exports = ContactResponseDTO;
