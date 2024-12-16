const personContactRepository = require('../repositories/personContactRepository');
const personRepository = require('../repositories/personRepository');
const contactRepository = require('../repositories/contactRepository');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonContactService {
    async listContacts(page, limit, filters = {}) {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
            const result = await personContactRepository.findAll(filters, validPage, validLimit);
            
            return PaginationHelper.formatResponse(
                result.data,
                result.total,
                validPage,
                validLimit
            );
        } catch (error) {
            logger.error('Erro ao listar contatos', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async getContact(id) {
        const contact = await personContactRepository.findById(id);
        if (!contact) {
            throw new ValidationError('Contato não encontrado', 404);
        }
        return contact;
    }

    async createContact(data) {
        try {
            // Verifica se já existe um contato do mesmo tipo para a mesma pessoa
            const existingContacts = await personContactRepository.findAll({ 
                person_id: data.person_id,
                contact_type: data.contact_type,
                contact_value: data.contact_value 
            });

            if (existingContacts.data.length > 0) {
                throw new ValidationError(
                    `Já existe um contato do tipo ${data.contact_type} para esta pessoa`,
                    400
                );
            }

            return await personContactRepository.create(data);
        } catch (error) {
            logger.error('Erro ao criar contato', {
                errorMessage: error.message,
                errorStack: error.stack,
                data
            });
            throw error;
        }
    }

    async updateContact(id, data) {
        try {
            const existingContact = await personContactRepository.findById(id);
            if (!existingContact) {
                throw new ValidationError('Contato não encontrado', 404);
            }

            // Se estiver alterando o tipo ou valor do contato, verifica duplicidade
            if (data.contact_type || data.contact_value) {
                const existingContacts = await personContactRepository.findAll({
                    person_id: existingContact.person_id,
                    contact_type: data.contact_type || existingContact.contact_type,
                    contact_value: data.contact_value || existingContact.contact_value
                });

                const hasDuplicate = existingContacts.data.some(
                    contact => contact.id !== parseInt(id)
                );

                if (hasDuplicate) {
                    throw new ValidationError(
                        `Já existe um contato do tipo ${data.contact_type || existingContact.contact_type} para esta pessoa`,
                        400
                    );
                }
            }

            return await personContactRepository.update(id, data);
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                errorMessage: error.message,
                errorStack: error.stack,
                id,
                data
            });
            throw error;
        }
    }

    async deleteContact(id) {
        try {
            const contact = await personContactRepository.findById(id);
            if (!contact) {
                throw new ValidationError('Contato não encontrado', 404);
            }

            return await personContactRepository.delete(id);
        } catch (error) {
            logger.error('Erro ao excluir contato', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }

    async createPersonContactWithValidation(personId, contactData) {
        try {
            // 1. Validar dados de entrada
            if (!personId || !contactData.contact_type || !contactData.contact_value) {
                throw new ValidationError('Dados inválidos para criação de contato');
            }

            // 2. Verificar se pessoa existe
            const person = await personRepository.findById(personId);
            if (!person) {
                throw new ValidationError('Pessoa não encontrada');
            }

            // 3. Buscar contato existente pelo valor e tipo
            let contact = await contactRepository.findByValue(
                contactData.contact_value, 
                contactData.contact_type
            );
            
            // 4. Criar contato se não existir
            if (!contact) {
                contact = await contactRepository.create({
                    contact_type: contactData.contact_type,
                    contact_value: contactData.contact_value,
                    active: true
                });
            }

            // 5. Verificar se já existe contato para esta pessoa
            const existingPersonContacts = await personContactRepository.findByPersonId(personId);

            // 6. Verificar se já existe este contato específico para a pessoa
            const duplicateContact = existingPersonContacts.find(
                pc => pc.contact_type === contactData.contact_type && 
                      pc.contact_value === contactData.contact_value
            );

            if (duplicateContact) {
                throw new ValidationError(
                    `Já existe um contato do tipo ${contactData.contact_type} com este valor para esta pessoa`
                );
            }

            // 7. Criar vínculo person_contact
            const personContact = await personContactRepository.create({
                person_id: personId,
                contact_id: contact.contact_id
            });

            return personContact;

        } catch (error) {
            logger.error('Erro ao adicionar contato à pessoa', {
                personId,
                contactData,
                errorMessage: error.message
            });
            throw error;
        }
    }
}

module.exports = new PersonContactService();
