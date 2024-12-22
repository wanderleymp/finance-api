const { updatePersonSchema } = require('../schemas/person.schema');

class UpdatePersonDTO {
    constructor(data) {
        this.name = data.name;
        this.document = data.document;
        this.email = data.email;
        this.birth_date = data.birth_date;
        this.type = data.type;
        this.is_active = data.is_active;
    }

    validate() {
        return updatePersonSchema.validate(this);
    }

    toJSON() {
        const json = {};
        
        if (this.name !== undefined) json.name = this.name;
        if (this.document !== undefined) json.document = this.document;
        if (this.email !== undefined) json.email = this.email;
        if (this.birth_date !== undefined) json.birth_date = this.birth_date;
        if (this.type !== undefined) json.type = this.type;
        if (this.is_active !== undefined) json.is_active = this.is_active;

        return json;
    }
}

module.exports = UpdatePersonDTO;
