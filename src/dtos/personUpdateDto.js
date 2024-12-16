const { ValidationError } = require('../utils/errors');
const { isValidDate, sanitizeString } = require('../utils/dataValidation');

class PersonUpdateDto {
    constructor(data) {
        this.full_name = data.full_name;
        this.birth_date = data.birth_date;
        this.person_type = data.person_type;
        this.fantasy_name = data.fantasy_name;
        this.active = data.active;
    }

    validate() {
        const errors = [];

        // Validações de nome
        if (this.full_name) {
            const sanitizedName = sanitizeString(this.full_name);
            if (sanitizedName.length < 2 || sanitizedName.length > 255) {
                errors.push('Nome deve ter entre 2 e 255 caracteres');
            }
        }

        // Validação de data de nascimento
        if (this.birth_date && !isValidDate(this.birth_date)) {
            errors.push('Data de nascimento inválida');
        }

        // Validação de tipo de pessoa
        const validPersonTypes = ['PF', 'PJ', 'PR', 'OT'];
        if (this.person_type && !validPersonTypes.includes(this.person_type)) {
            errors.push('Tipo de pessoa inválido');
        }

        // Validação de nome fantasia
        if (this.fantasy_name) {
            const sanitizedFantasyName = sanitizeString(this.fantasy_name);
            if (sanitizedFantasyName.length > 255) {
                errors.push('Nome fantasia deve ter no máximo 255 caracteres');
            }
        }

        // Validação de status ativo
        if (this.active !== undefined && typeof this.active !== 'boolean') {
            errors.push('Status ativo deve ser um valor booleano');
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join('; '));
        }

        return this;
    }

    toJSON() {
        const json = {};
        
        if (this.full_name) {
            json.full_name = this.formatName(this.full_name);
        }
        
        if (this.birth_date) {
            json.birth_date = this.birth_date;
        }
        
        if (this.person_type) {
            json.person_type = this.person_type;
        }
        
        if (this.fantasy_name) {
            json.fantasy_name = this.formatName(this.fantasy_name);
        }
        
        if (this.active !== undefined) {
            json.active = this.active;
        }

        return json;
    }

    formatName(name) {
        if (!name) return name;
        
        return name
            .trim()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

module.exports = PersonUpdateDto;
