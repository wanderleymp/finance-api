const { updatePersonSchema } = require('../schemas/person.schema');

class UpdatePersonDTO {
    constructor(data) {
        this.full_name = data.full_name;
        this.fantasy_name = data.fantasy_name;
        this.birth_date = data.birth_date;
        this.person_type = data.person_type;
        this.active = data.active;
    }

    validate() {
        return updatePersonSchema.validate(this);
    }

    toJSON() {
        const json = {};
        
        if (this.full_name !== undefined) json.full_name = this.full_name;
        if (this.fantasy_name !== undefined) json.fantasy_name = this.fantasy_name;
        if (this.birth_date !== undefined) json.birth_date = this.birth_date;
        if (this.person_type !== undefined) json.person_type = this.person_type;
        if (this.active !== undefined) json.active = this.active;

        return json;
    }
}

module.exports = UpdatePersonDTO;
