const ContractExtraServiceService = require('../service/contract-extra-service.service');
const { logger } = require('../../../middlewares/logger');

class ContractExtraServiceController {
    constructor(service = new ContractExtraServiceService()) {
        this.service = service;
    }

    async create(req, res) {
        try {
            const extraServiceId = await this.service.create(req.body);
            res.status(201).json({ extraServiceId });
        } catch (error) {
            logger.error('Erro ao criar serviço extra', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    }

    async findById(req, res) {
        try {
            const extraService = await this.service.findById(req.params.extraServiceId);
            res.status(200).json(extraService);
        } catch (error) {
            logger.error('Erro ao buscar serviço extra', { error: error.message });
            res.status(404).json({ error: error.message });
        }
    }

    async findByContractId(req, res) {
        try {
            const { contractId } = req.params;
            const { startDate, endDate } = req.query;
            const extraServices = await this.service.findByContractId(contractId, { startDate, endDate });
            res.status(200).json(extraServices);
        } catch (error) {
            logger.error('Erro ao buscar serviços extras do contrato', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    }

    async findAll(req, res) {
        try {
            const { 
                page, 
                limit, 
                contractId, 
                startDate, 
                endDate 
            } = req.query;

            const extraServices = await this.service.findAll({ 
                page,
                limit, 
                contractId, 
                startDate, 
                endDate 
            });

            res.status(200).json(extraServices);
        } catch (error) {
            logger.error('Erro ao buscar serviços extras', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { extraServiceId } = req.params;
            const updatedExtraService = await this.service.update(extraServiceId, req.body);
            res.status(200).json(updatedExtraService);
        } catch (error) {
            logger.error('Erro ao atualizar serviço extra', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { extraServiceId } = req.params;
            const deleted = await this.service.delete(extraServiceId);
            res.status(200).json({ deleted });
        } catch (error) {
            logger.error('Erro ao deletar serviço extra', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = ContractExtraServiceController;
