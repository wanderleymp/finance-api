const { createPersonSchema } = require('../schemas/person.schema');

class CreatePersonDTO {
    constructor(data) {
        this.full_name = data.full_name;
        this.fantasy_name = data.fantasy_name;
        this.birth_date = data.birth_date;
        this.person_type = data.person_type || 'PJ';
        this.active = data.active !== undefined ? data.active : true;
    }

    validate() {
        return createPersonSchema.validate(this);
    }

    toJSON() {
        return {
            full_name: this.full_name,
            fantasy_name: this.fantasy_name,
            birth_date: this.birth_date,
            person_type: this.person_type,
            active: this.active
        };
    }

    static fromDatabase(data) {
        return new CreatePersonDTO({
            full_name: data.full_name,
            fantasy_name: data.fantasy_name,
            birth_date: data.birth_date,
            person_type: data.person_type,
            active: data.active
        });
    }
}

module.exports = CreatePersonDTO;
