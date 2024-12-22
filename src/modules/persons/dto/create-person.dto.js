const { createPersonSchema } = require('../schemas/person.schema');

class CreatePersonDTO {
    constructor(data) {
        this.name = data.name;
        this.document = data.document;
        this.email = data.email;
        this.birth_date = data.birth_date;
        this.type = data.type || 'individual';
        this.is_active = data.is_active !== undefined ? data.is_active : true;
    }

    validate() {
        return createPersonSchema.validate(this);
    }

    toJSON() {
        return {
            name: this.name,
            document: this.document,
            email: this.email,
            birth_date: this.birth_date,
            type: this.type,
            is_active: this.is_active
        };
    }

    static fromDatabase(data) {
        return new CreatePersonDTO({
            name: data.name,
            document: data.document,
            email: data.email,
            birth_date: data.birth_date,
            type: data.type,
            is_active: data.is_active
        });
    }
}

module.exports = CreatePersonDTO;
