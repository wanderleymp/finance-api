class ContactResponseDTO {
    constructor(data) {
        this.id = data.id || data.contact_id;
        this.person_id = data.person_id;
        this.type = data.type;
        this.contact = this.formatContact(data.type, data.contact);
        this.description = data.description;
        this.is_main = data.is_main || false;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    formatContact(type, contact) {
        if (!contact) return null;

        switch(type.toLowerCase()) {
            case 'phone':
                // Formata telefone para (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
                const cleaned = contact.replace(/\D/g, '');
                if (cleaned.length === 10) {
                    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
                } else if (cleaned.length === 11) {
                    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
                }
                return cleaned;
            case 'email':
                return contact.toLowerCase();
            default:
                return contact;
        }
    }

    static fromDatabase(data) {
        return new ContactResponseDTO(data);
    }
}

module.exports = ContactResponseDTO;
