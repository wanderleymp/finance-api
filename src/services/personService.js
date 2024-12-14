const personRepository = require('../repositories/personRepository');
const personContactRepository = require('../repositories/personContactRepository');
const personDocumentRepository = require('../repositories/personDocumentRepository');
const personAddressRepository = require('../repositories/personAddressRepository');
const { ValidationError } = require('../utils/errors');
const PaginationHelper = require('../utils/paginationHelper');

class PersonService {
    async listPersons(page, limit, search = '', include = []) {
        const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
        const { data, total } = await personRepository.findAll(validPage, validLimit, search);

        const personsWithData = await Promise.all(
            data.map(async (person) => {
                const enrichedPerson = { ...person };

                if (include.includes('documents')) {
                    enrichedPerson.documents = await personDocumentRepository.findByPersonId(person.person_id);
                }
                
                if (include.includes('contacts')) {
                    enrichedPerson.contacts = await personContactRepository.findByPersonId(person.person_id);
                }

                if (include.includes('addresses')) {
                    enrichedPerson.addresses = await personAddressRepository.findByPersonId(person.person_id);
                }

                return enrichedPerson;
            })
        );

        return PaginationHelper.formatResponse(personsWithData, total, validPage, validLimit);
    }

    async getPerson(personId) {
        const person = await personRepository.findById(personId);
        if (!person) {
            throw new ValidationError('Pessoa não encontrada', 404);
        }
        const documents = await personDocumentRepository.findByPersonId(personId);
        const contacts = await personContactRepository.findByPersonId(personId);
        const addresses = await personAddressRepository.findByPersonId(personId);

        return {
            ...person,
            documents,
            contacts,
            addresses
        };
    }

    async getPersonDocuments(personId) {
        // Verifica se a pessoa existe
        await this.getPerson(personId);
        return await personDocumentRepository.findByPersonId(personId);
    }

    async getPersonContacts(personId) {
        // Verifica se a pessoa existe
        await this.getPerson(personId);
        return await personContactRepository.findByPersonId(personId);
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

        // Buscar documentos, contatos e endereços para todas as pessoas
        const personsWithRelations = await Promise.all(
            data.map(async (person) => {
                const documents = await personDocumentRepository.findByPersonId(person.person_id);
                const contacts = await personContactRepository.findByPersonId(person.person_id);
                const addresses = await personAddressRepository.findByPersonId(person.person_id);
                return {
                    ...person,
                    documents,
                    contacts,
                    addresses
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
