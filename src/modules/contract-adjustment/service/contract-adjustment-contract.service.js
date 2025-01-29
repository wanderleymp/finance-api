const ContractAdjustmentContractRepository = require('../repository/contract-adjustment-contract.repository');
const { logger } = require('../../../middlewares/logger');

class ContractAdjustmentContractService {
    constructor() {
        this.repository = new ContractAdjustmentContractRepository();
        this.logger = logger;
    }

    async findAll(filters = {}) {
        try {
            this.logger.info('Buscando ajustes de contratos', { filters });
            return await this.repository.findAll(filters);
        } catch (error) {
            this.logger.error('Erro ao buscar ajustes de contratos', { error: error.message });
            throw error;
        }
    }

    async findById(adjustmentId, contractId) {
        try {
            this.logger.info('Buscando ajuste de contrato específico', { adjustmentId, contractId });
            return await this.repository.findById(adjustmentId, contractId);
        } catch (error) {
            this.logger.error('Erro ao buscar ajuste de contrato', { error: error.message });
            throw error;
        }
    }

    async create(data) {
        try {
            this.logger.info('Criando ajuste de contrato', { data });
            return await this.repository.create(data);
        } catch (error) {
            this.logger.error('Erro ao criar ajuste de contrato', { error: error.message });
            throw error;
        }
    }

    async update(adjustmentId, contractId, data) {
        try {
            this.logger.info('Atualizando ajuste de contrato', { adjustmentId, contractId, data });
            return await this.repository.update(adjustmentId, contractId, data);
        } catch (error) {
            this.logger.error('Erro ao atualizar ajuste de contrato', { error: error.message });
            throw error;
        }
    }

    async delete(adjustmentId, contractId) {
        try {
            this.logger.info('Deletando ajuste de contrato', { adjustmentId, contractId });
            return await this.repository.delete(adjustmentId, contractId);
        } catch (error) {
            this.logger.error('Erro ao deletar ajuste de contrato', { error: error.message });
            throw error;
        }
    }

    async bulkCreate(adjustmentContracts) {
        try {
            this.logger.info('Criando ajustes de contratos em lote', { quantidade: adjustmentContracts.length });
            return await this.repository.bulkCreate(adjustmentContracts);
        } catch (error) {
            this.logger.error('Erro ao criar ajustes de contratos em lote', { error: error.message });
            throw error;
        }
    }
}

module.exports = ContractAdjustmentContractService;
