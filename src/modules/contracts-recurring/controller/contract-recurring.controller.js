const ContractRecurringService = require('../service/contract-recurring.service');
const { logger } = require('../../../middlewares/logger');

class ContractRecurringController {
    constructor() {
        this.service = new ContractRecurringService();
    }

    async findAll(req, res, next) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await this.service.findAll(Number(page), Number(limit), filters);
            
            logger.info('Contratos recorrentes listados', { 
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
            const { id } = req.params;
            const result = await this.service.findById(Number(id));
            
            logger.info('Contrato recorrente encontrado', { id });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const result = await this.service.create(req.body);
            
            logger.info('Contrato recorrente criado', { 
                id: result.contract_recurring_id,
                name: result.contract_name 
            });

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const result = await this.service.update(Number(id), req.body);
            
            logger.info('Contrato recorrente atualizado', { 
                id,
                name: result.contract_name 
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await this.service.delete(Number(id));
            
            logger.info('Contrato recorrente removido', { id });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async findPendingBillings(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const currentDate = new Date();
            
            const result = await this.service.findPendingBillings(
                Number(page), 
                Number(limit), 
                currentDate
            );
            
            logger.info('Contratos pendentes listados', { 
                page, 
                limit, 
                totalItems: result.meta.totalItems 
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async processBilling(req, res, next) {
        try {
            const { body = [] } = req;

            const result = await this.service.billing(body);
            
            logger.info('Processamento de faturamento concluído', { 
                totalContracts: body.length 
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async processSingleContractBilling(req, res, next) {
        try {
            const { id } = req.params;
            
            const result = await this.service.billing([Number(id)]);
            
            logger.info('Processamento de faturamento para contrato específico', { 
                contractId: id 
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async contractAdjustment(req, res, next) {
        try {
            const { contractIds } = req.body;

            if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
                return res.status(400).json({ error: 'Lista de contratos inválida' });
            }

            const result = await this.service.contractAdjustment(contractIds);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async processSingleContractAdjustment(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'ID do contrato é obrigatório' });
            }

            const result = await this.service.contractAdjustment([id]);

            res.json(result[0]);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ContractRecurringController;
