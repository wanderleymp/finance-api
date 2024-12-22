const { logger } = require('../../middlewares/logger');
const PersonService = require('./person.service');
const { handleResponse, handleError } = require('../../utils/responseHandler');

class PersonController {
    constructor(personService = new PersonService()) {
        this.personService = personService;
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;

            const result = await this.personService.findAll(
                filters, 
                parseInt(page), 
                parseInt(limit)
            );

            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar pessoas', {
                error: error.message,
                query: req.query
            });
            return handleError(res, error);
        }
    }

    async findById(req, res) {
        try {
            const { id } = req.params;

            const person = await this.personService.findById(parseInt(id));

            if (!person) {
                return handleError(res, new Error('Pessoa não encontrada'), 404);
            }

            return handleResponse(res, person);
        } catch (error) {
            logger.error('Erro ao buscar pessoa por ID', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }

    async findPersonWithDetails(req, res) {
        try {
            const { id } = req.params;

            const personDetails = await this.personService.findPersonWithDetails(parseInt(id));

            if (!personDetails) {
                return handleError(res, new Error('Pessoa não encontrada'), 404);
            }

            return handleResponse(res, personDetails);
        } catch (error) {
            logger.error('Erro ao buscar detalhes da pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }

    async findDocuments(req, res) {
        try {
            const { id } = req.params;

            const result = await this.personService.findDocuments(parseInt(id));

            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar documentos da pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }

    async findContacts(req, res) {
        try {
            const { id } = req.params;

            const result = await this.personService.findContacts(parseInt(id));

            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }

    async findAddresses(req, res) {
        try {
            const { id } = req.params;

            const result = await this.personService.findAddresses(parseInt(id));

            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar endereços da pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }

    async create(req, res) {
        try {
            const personData = req.body;

            const newPerson = await this.personService.create(personData, req);

            return handleResponse(res, newPerson, 201);
        } catch (error) {
            logger.error('Erro ao criar pessoa', {
                error: error.message,
                body: req.body
            });
            return handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const personData = req.body;

            const updatedPerson = await this.personService.update(
                parseInt(id), 
                personData, 
                req
            );

            return handleResponse(res, updatedPerson);
        } catch (error) {
            logger.error('Erro ao atualizar pessoa', {
                error: error.message,
                params: req.params,
                body: req.body
            });
            return handleError(res, error);
        }
    }

    async addAddress(req, res) {
        try {
            const { id } = req.params;
            const addressData = req.body;

            const newAddress = await this.personService.addAddress(
                parseInt(id), 
                addressData
            );

            return handleResponse(res, newAddress, 201);
        } catch (error) {
            logger.error('Erro ao adicionar endereço à pessoa', {
                error: error.message,
                params: req.params,
                body: req.body
            });
            return handleError(res, error);
        }
    }

    async addContact(req, res) {
        try {
            const { id } = req.params;
            const contactData = req.body;

            const newContact = await this.personService.addContact(
                parseInt(id), 
                contactData
            );

            return handleResponse(res, newContact, 201);
        } catch (error) {
            logger.error('Erro ao adicionar contato à pessoa', {
                error: error.message,
                params: req.params,
                body: req.body
            });
            return handleError(res, error);
        }
    }

    async removeAddress(req, res) {
        try {
            const { addressId } = req.params;

            const removedAddress = await this.personService.removeAddress(
                parseInt(addressId)
            );

            if (!removedAddress) {
                return handleError(res, new Error('Endereço não encontrado'), 404);
            }

            return handleResponse(res, removedAddress);
        } catch (error) {
            logger.error('Erro ao remover endereço', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }

    async removeContact(req, res) {
        try {
            const { contactId } = req.params;

            const removedContact = await this.personService.removeContact(
                parseInt(contactId)
            );

            if (!removedContact) {
                return handleError(res, new Error('Contato não encontrado'), 404);
            }

            return handleResponse(res, removedContact);
        } catch (error) {
            logger.error('Erro ao remover contato', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            // Verifica se a pessoa tem dependências
            const hasDependencies = await this.personService.checkPersonDependencies(
                parseInt(id)
            );

            if (hasDependencies) {
                return handleError(
                    res, 
                    new Error('Não é possível deletar pessoa com endereços ou contatos vinculados'), 
                    400
                );
            }

            const deletedPerson = await this.personService.delete(
                parseInt(id), 
                req
            );

            return handleResponse(res, deletedPerson);
        } catch (error) {
            logger.error('Erro ao deletar pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }
}

module.exports = PersonController;
