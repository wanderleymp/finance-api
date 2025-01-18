const { logger } = require('../../../middlewares/logger');
const ContractMovementService = require('../service/contract-movement.service');

class ContractMovementController {
    constructor() {
        this.service = new ContractMovementService();
    }

    async findAll(req, res, next) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await this.service.findAll(filters, Number(page), Number(limit));
            
            logger.info('Movimentos de contrato listados', { 
                page, 
                limit, 
                totalItems: result.meta.totalItems 
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async findById(req, res, next) {
        try {
            const { contract_id, movement_id } = req.params;
            const result = await this.service.findById(Number(contract_id), Number(movement_id));
            
            logger.info('Movimento de contrato encontrado', { contract_id, movement_id });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const result = await this.service.create(req.body);
            
            logger.info('Movimento de contrato criado', { 
                contract_id: result.contract_id,
                movement_id: result.movement_id 
            });

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { contract_id, movement_id } = req.params;
            const result = await this.service.update(Number(contract_id), Number(movement_id), req.body);
            
            logger.info('Movimento de contrato atualizado', { contract_id, movement_id });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { contract_id, movement_id } = req.params;
            const result = await this.service.delete(Number(contract_id), Number(movement_id));
            
            logger.info('Movimento de contrato removido', { contract_id, movement_id });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ContractMovementController;
