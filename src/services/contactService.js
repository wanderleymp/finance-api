const contactRepository = require('../repositories/contactRepository');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class ContactService {
    async listContacts(page, limit, filters = {}) {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
            const result = await contactRepository.findAll(filters, validPage, validLimit);
            
            return PaginationHelper.formatResponse(
                result.data,
                result.total,
                validPage,
                validLimit
            );
        } catch (error) {
            logger.error('Erro ao listar contatos', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    async getContact(contactId) {
        const contact = await contactRepository.findById(contactId);
        if (!contact) {
            throw new ValidationError('Contato não encontrado', 404);
        }
        return contact;
    }

    async createContact(contactData) {
        try {
            // Verifica se já existe um contato do mesmo tipo com o mesmo valor
            const existingContacts = await contactRepository.findAll({ 
                contact_type: contactData.contact_type,
                contact_value: contactData.contact_value 
            });

            if (existingContacts.data.length > 0) {
                throw new ValidationError(
                    `Já existe um contato do tipo ${contactData.contact_type} com o valor ${contactData.contact_value}`,
                    400
                );
            }

            return await contactRepository.create(contactData);
        } catch (error) {
            logger.error('Erro ao criar contato', {
                error: error.message,
                contactData
            });
            throw error;
        }
    }

    async updateContact(contactId, contactData) {
        try {
            // Verifica se o contato existe
            const contact = await this.getContact(contactId);

            // Se estiver alterando o tipo ou valor do contato, verifica duplicidade
            if (contactData.contact_type || contactData.contact_value) {
                const existingContacts = await contactRepository.findAll({ 
                    contact_type: contactData.contact_type || contact.contact_type,
                    contact_value: contactData.contact_value || contact.contact_value
                });

                const duplicateContact = existingContacts.data.find(c => 
                    c.contact_id !== contactId
                );

                if (duplicateContact) {
                    throw new ValidationError(
                        `Já existe um contato do tipo ${contactData.contact_type || contact.contact_type} com o valor ${contactData.contact_value || contact.contact_value}`,
                        400
                    );
                }
            }

            const updatedContact = await contactRepository.update(contactId, contactData);
            if (!updatedContact) {
                throw new ValidationError('Contato não encontrado', 404);
            }

            return updatedContact;
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                error: error.message,
                contactId,
                contactData
            });
            throw error;
        }
    }

    async deleteContact(contactId) {
        try {
            const contact = await this.getContact(contactId);
            await contactRepository.delete(contactId);
        } catch (error) {
            logger.error('Erro ao deletar contato', {
                error: error.message,
                contactId
            });
            throw error;
        }
    }
}

module.exports = new ContactService();
