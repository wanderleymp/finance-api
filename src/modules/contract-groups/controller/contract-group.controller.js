const ContractGroupService = require('../service/contract-group.service');
const { logger } = require('../../../middlewares/logger');

class ContractGroupController {
    constructor() {
        this.service = new ContractGroupService();
    }

    async findAll(req, res, next) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await this.service.findAll(filters, Number(page), Number(limit));
            
            logger.info('Grupos de contrato listados', { 
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
            
            logger.info('Grupo de contrato encontrado', { id });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const result = await this.service.create(req.body);
            
            logger.info('Grupo de contrato criado', { 
                id: result.contract_group_id,
                name: result.group_name 
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
            
            logger.info('Grupo de contrato atualizado', { 
                id,
                name: result.group_name 
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
            
            logger.info('Grupo de contrato excluído', { id });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ContractGroupController;
