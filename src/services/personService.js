const personRepository = require('../repositories/personRepository');
const personContactRepository = require('../repositories/personContactRepository');
const personDocumentRepository = require('../repositories/personDocumentRepository');
const { ValidationError } = require('../utils/errors');
const PaginationHelper = require('../utils/paginationHelper');

class PersonService {
    async listPersons(page, limit, search = '', include = []) {
        const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
        const { data, total } = await personRepository.findAll(validPage, validLimit, search);

        if (include.includes('documents')) {
            const personsWithDocuments = await Promise.all(
                data.map(async (person) => {
                    const documents = await personDocumentRepository.findByPersonId(person.person_id);
                    return {
                        ...person,
                        documents
                    };
                })
            );
            return PaginationHelper.formatResponse(personsWithDocuments, total, validPage, validLimit);
        }

        return PaginationHelper.formatResponse(data, total, validPage, validLimit);
    }

    async getPerson(personId) {
        const person = await personRepository.findById(personId);
        if (!person) {
            throw new ValidationError('Pessoa não encontrada', 404);
        }
        return person;
    }

    async getPersonWithDetails(personId) {
        // Busca a pessoa
        const person = await this.getPerson(personId);

        // Busca documentos
        const documents = await personDocumentRepository.findByPersonId(personId);

        return {
            ...person,
            documents
        };
    }

    async getPersonDocuments(personId) {
        // Verifica se a pessoa existe
        await this.getPerson(personId);
        return await personDocumentRepository.findByPersonId(personId);
    }

    async createPerson(personData) {
        // Formatar full_name e fantasy_name antes de validar
        personData.full_name = this.formatName(personData.full_name);
        if (personData.fantasy_name) {
            personData.fantasy_name = this.formatName(personData.fantasy_name);
        }

        this.validatePersonData(personData);
        return await personRepository.create(personData);
    }

    async updatePerson(personId, personData) {
        // Formatar full_name e fantasy_name antes de validar
        if (personData.full_name) {
            personData.full_name = this.formatName(personData.full_name);
        }
        if (personData.fantasy_name) {
            personData.fantasy_name = this.formatName(personData.fantasy_name);
        }

        await this.getPerson(personId);
        this.validatePersonData(personData);
        return await personRepository.update(personId, personData);
    }

    async deletePerson(personId) {
        await this.getPerson(personId);
        await personRepository.delete(personId);
    }

    async listPersonsWithRelations(page, limit, search = '') {
        const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
        const { data, total } = await personRepository.findAll(validPage, validLimit, search);

        // Buscar documentos para todas as pessoas
        const personsWithRelations = await Promise.all(
            data.map(async (person) => {
                const documents = await personDocumentRepository.findByPersonId(person.person_id);
                return {
                    ...person,
                    documents
                };
            })
        );

        return PaginationHelper.formatResponse(personsWithRelations, total, validPage, validLimit);
    }

    validatePersonData(personData) {
        const { full_name, person_type } = personData;

        if (!full_name || full_name.trim() === '') {
            throw new ValidationError('Nome completo é obrigatório');
        }

        const validPersonTypes = ['PF', 'PJ', 'PR', 'OT'];
        if (person_type && !validPersonTypes.includes(person_type)) {
            throw new ValidationError('Tipo de pessoa inválido');
        }
    }

    // Método para formatar nome com primeira letra maiúscula
    formatName(name) {
        if (!name) return name;
        
        // Divide o nome em palavras, capitaliza cada palavra e junta novamente
        return name
            .trim()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

module.exports = new PersonService();
