const express = require('express');
const router = express.Router();
const { logger } = require('../../middlewares/logger');
const PersonService = require('./person.service');
const { handleResponse, handleError } = require('../../utils/responseHandler');
const { authMiddleware } = require('../../middlewares/auth');

class PersonController {
    constructor(personService = new PersonService()) {
        this.personService = personService;
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.use(authMiddleware);
        
        this.router.get('/', this.findAll.bind(this));
        this.router.get('/details', this.findAllWithDetails.bind(this));
        this.router.get('/:id', this.findById.bind(this));
        this.router.get('/:id/details', this.findPersonWithDetails.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.post('/cnpj', this.createOrUpdateFromCnpj.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.post('/:id/addresses', this.addAddress.bind(this));
        this.router.post('/:id/contacts', this.addContact.bind(this));
        this.router.delete('/addresses/:id', this.removeAddress.bind(this));
        this.router.delete('/contacts/:id', this.removeContact.bind(this));
    }

    async findAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                search: req.query.search,
                type: req.query.type,
                document: req.query.document
            };
            const order = {
                field: req.query.orderBy,
                direction: req.query.orderDirection?.toUpperCase()
            };

            const result = await this.personService.findAll(filters, page, limit, order);

            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar pessoas', {
                error: error.message,
                query: req.query
            });
            return handleError(res, error);
        }
    }

    async findAllWithDetails(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                search: req.query.search,
                type: req.query.type,
                document: req.query.document
            };
            const order = {
                field: req.query.orderBy,
                direction: req.query.orderDirection?.toUpperCase()
            };

            logger.info('Iniciando busca de pessoas com detalhes no controller', { 
                page, 
                limit, 
                filters, 
                order 
            });

            const result = await this.personService.findAllWithDetails(page, limit, filters, order);

            logger.info('Resultado da busca de pessoas no controller', { 
                itemsCount: result.items ? result.items.length : 'N/A',
                meta: result.meta 
            });

            if (!result) {
                logger.warn('Resultado da busca de pessoas é undefined');
                return handleResponse(res, {
                    items: [],
                    meta: {
                        totalItems: 0,
                        itemCount: 0,
                        itemsPerPage: limit,
                        totalPages: 0,
                        currentPage: page
                    }
                });
            }

            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar pessoas com detalhes no controller', {
                error: error.message,
                query: req.query,
                stack: error.stack
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

    async createOrUpdateFromCnpj(req, res) {
        try {
            const { cnpj, license_id } = req.body;

            if (!cnpj) {
                return handleError(res, new Error('CNPJ é obrigatório'));
            }

            const person = await this.personService.createOrUpdateFromCnpj(cnpj, license_id, req);
            return handleResponse(res, person);
        } catch (error) {
            logger.error('Erro ao criar/atualizar pessoa por CNPJ', {
                error: error.message,
                cnpj: req.body.cnpj
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
            await this.personService.delete(parseInt(id));
            return handleResponse(res, { message: 'Pessoa deletada com sucesso' });
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
