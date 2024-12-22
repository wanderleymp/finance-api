const { logger } = require('../../middlewares/logger');
const AddressService = require('./address.service');
const cepService = require('./cep.service');
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

            return handleResponse(res, result);
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
            
            logger.info('Buscando endereço por ID', { id });

            const address = await this.addressService.findById(id);

            // Retorna o endereço diretamente sem envolver paginação
            return res.status(200).json(address);
        } catch (error) {
            logger.error('Erro ao buscar endereço por ID', {
                error: error.message,
                id: req.params.id
            });

            return handleError(error, res);
        }
    }

    async findByPersonId(req, res) {
        try {
            const { personId } = req.params;

            const addresses = await this.addressService.findByPersonId(parseInt(personId));

            return handleResponse(res, addresses);
        } catch (error) {
            logger.error('Erro ao buscar endereços da pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(error, res);
        }
    }

    async findByCep(req, res) {
        try {
            const { cep } = req.params;
            
            logger.info('Iniciando consulta de CEP', { cep });

            const address = await cepService.findAddressByCep(cep);

            return handleResponse(res, address);
        } catch (error) {
            logger.error('Erro na consulta de CEP', {
                error: error.message,
                cep: req.params.cep
            });

            // Verifica o tipo de erro e retorna uma resposta apropriada
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    message: error.message,
                    code: error.statusCode
                });
            }

            // Erro genérico
            return res.status(500).json({
                message: 'Erro ao consultar CEP',
                details: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const addressData = req.body;

            const newAddress = await this.addressService.create(addressData, req);

            return handleResponse(res, newAddress, 201);
        } catch (error) {
            if (error.code === '23505') {
                // Erro de chave única
                return res.status(400).json({
                    message: 'Endereço já cadastrado para esta pessoa',
                    details: 'Um endereço com os mesmos dados principais já existe'
                });
            }
            // Outros erros
            console.error('Erro ao criar endereço:', error);
            return res.status(500).json({
                message: 'Erro interno ao processar endereço',
                details: error.message
            });
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

            return handleResponse(res, updatedAddress);
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

            return handleResponse(res, deletedAddress);
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
