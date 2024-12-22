const { logger } = require('../../middlewares/logger');
const AddressService = require('./address.service');
const { handleResponse, handleError } = require('../../utils/responseHandler');

class AddressController {
    constructor(addressService) {
        console.log('AddressService:', addressService);
        this.addressService = addressService;
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;

            const result = await this.addressService.findAll(
                filters, 
                parseInt(page), 
                parseInt(limit)
            );

            return handleResponse(result, res);
        } catch (error) {
            logger.error('Erro ao buscar endereços', {
                error: error.message,
                query: req.query
            });
            return handleError(error, res);
        }
    }

    async findById(req, res) {
        try {
            const { id } = req.params;

            const address = await this.addressService.findById(parseInt(id));

            if (!address) {
                return handleError(new Error('Endereço não encontrado'), res, 404);
            }

            return handleResponse(address, res);
        } catch (error) {
            logger.error('Erro ao buscar endereço por ID', {
                error: error.message,
                params: req.params
            });
            return handleError(error, res);
        }
    }

    async findByPersonId(req, res) {
        try {
            const { personId } = req.params;

            const addresses = await this.addressService.findByPersonId(parseInt(personId));

            return handleResponse(addresses, res);
        } catch (error) {
            logger.error('Erro ao buscar endereços da pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(error, res);
        }
    }

    async findMainAddressByPersonId(req, res) {
        try {
            const { personId } = req.params;

            const mainAddress = await this.addressService.findMainAddressByPersonId(parseInt(personId));

            if (!mainAddress) {
                return handleError(new Error('Endereço principal não encontrado'), res, 404);
            }

            return handleResponse(mainAddress, res);
        } catch (error) {
            logger.error('Erro ao buscar endereço principal da pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(error, res);
        }
    }

    async create(req, res) {
        try {
            const addressData = req.body;

            const newAddress = await this.addressService.create(addressData, req);

            return handleResponse(newAddress, res, 201);
        } catch (error) {
            logger.error('Erro ao criar endereço', {
                error: error.message,
                body: req.body
            });
            return handleError(error, res);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const addressData = req.body;

            const updatedAddress = await this.addressService.update(
                parseInt(id), 
                addressData, 
                req
            );

            return handleResponse(updatedAddress, res);
        } catch (error) {
            logger.error('Erro ao atualizar endereço', {
                error: error.message,
                params: req.params,
                body: req.body
            });
            return handleError(error, res);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            const deletedAddress = await this.addressService.delete(
                parseInt(id), 
                req
            );

            return handleResponse(deletedAddress, res);
        } catch (error) {
            logger.error('Erro ao deletar endereço', {
                error: error.message,
                params: req.params
            });
            return handleError(error, res);
        }
    }
}

module.exports = AddressController;
