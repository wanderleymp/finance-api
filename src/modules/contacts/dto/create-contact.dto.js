class CreateContactDTO {
    constructor(data) {
        this.person_id = data.person_id;
        this.type = data.type.toLowerCase();
        this.contact = this.formatContact(data.type, data.contact);
        this.description = data.description || null;
        this.is_main = data.is_main || false;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
    }

    formatContact(type, contact) {
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
        return schema.validateCreate(this);
    }
}

module.exports = CreateContactDTO;
