const ContractAdjustmentContractService = require('../service/contract-adjustment-contract.service');
const { logger } = require('../../../middlewares/logger');

class ContractAdjustmentContractController {
    constructor() {
        this.service = new ContractAdjustmentContractService();
        this.logger = logger;
    }

    async findAll(req, res, next) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await this.service.findAll(filters);
            
            this.logger.info('Ajustes de contratos listados', { 
                page, 
                limit, 
                totalItems: result.length 
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async findById(req, res, next) {
        try {
            const { adjustmentId, contractId } = req.params;
            const result = await this.service.findById(
                Number(adjustmentId), 
                Number(contractId)
            );
            
            this.logger.info('Ajuste de contrato encontrado', { 
                adjustmentId, 
                contractId 
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const result = await this.service.create(req.body);
            
            this.logger.info('Ajuste de contrato criado', { 
                adjustmentId: result.adjustment_id,
                contractId: result.contract_id
            });

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { adjustmentId, contractId } = req.params;
            const result = await this.service.update(
                Number(adjustmentId), 
                Number(contractId), 
                req.body
            );
            
            this.logger.info('Ajuste de contrato atualizado', { 
                adjustmentId, 
                contractId 
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { adjustmentId, contractId } = req.params;
            await this.service.delete(
                Number(adjustmentId), 
                Number(contractId)
            );
            
            this.logger.info('Ajuste de contrato removido', { 
                adjustmentId, 
                contractId 
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async bulkCreate(req, res, next) {
        try {
            const result = await this.service.bulkCreate(req.body);
            
            this.logger.info('Ajustes de contratos criados em lote', { 
                quantidade: result.length 
            });

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ContractAdjustmentContractController;
