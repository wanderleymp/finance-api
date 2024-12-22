class UpdateContactDTO {
    constructor(data) {
        this.person_id = data.person_id;
        this.type = data.type ? data.type.toLowerCase() : undefined;
        this.contact = data.contact ? this.formatContact(data.type, data.contact) : undefined;
        this.description = data.description;
        this.is_main = data.is_main;
        this.is_active = data.is_active;
    }

    formatContact(type, contact) {
        if (!type) return contact;

        switch(type.toLowerCase()) {
            case 'phone':
                // Remove todos os caracteres não numéricos
                return contact.replace(/\D/g, '');
            case 'email':
                return contact.toLowerCase().trim();
            default:
                return contact.trim();
        }
    }

    validate(schema) {
        return schema.validateUpdate(this);
    }
}

module.exports = UpdateContactDTO;
