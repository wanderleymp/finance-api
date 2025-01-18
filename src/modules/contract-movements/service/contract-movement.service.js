const { logger } = require('../../../middlewares/logger');
const { NotFoundError, BusinessError, ValidationError } = require('../../../utils/errors');
const ContractMovementRepository = require('../repository/contract-movement.repository');
const ContractMovementValidator = require('../validators/contract-movement.validator');
const ContractMovementDetailedDTO = require('../dto/contract-movement-detailed.dto');

class ContractMovementService {
    constructor() {
        this.repository = new ContractMovementRepository();
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const validatedFilters = ContractMovementValidator.findAll({ ...filters, page, limit });

            const result = await this.repository.findAll(validatedFilters, page, limit);

            return result;
        } catch (error) {
            logger.error('Erro ao listar movimentos de contrato', { error });
            throw error;
        }
    }

    async findById(contract_id, movement_id) {
        try {
            const validatedId = ContractMovementValidator.findById({ contract_id, movement_id });

            const contractMovement = await this.repository.findById(validatedId);
            if (!contractMovement) {
                throw new NotFoundError('Movimento de contrato não encontrado');
            }

            const contractMovementDTO = ContractMovementDetailedDTO.fromEntity(contractMovement);

            return contractMovementDTO;
        } catch (error) {
            logger.error('Erro ao buscar movimento de contrato por ID', { error });
            throw error;
        }
    }

    async create(data) {
        try {
            const validatedData = ContractMovementValidator.create(data);
            const contractMovement = await this.repository.create(validatedData);

            const contractMovementDTO = ContractMovementDetailedDTO.fromEntity(contractMovement);

            return contractMovementDTO;
        } catch (error) {
            logger.error('Erro ao criar movimento de contrato', { error });
            throw error;
        }
    }

    async update(contract_id, movement_id, data) {
        try {
            const validatedData = ContractMovementValidator.update({ ...data, contract_id, movement_id });

            const contractMovement = await this.repository.update({ contract_id, movement_id }, validatedData);
            if (!contractMovement) {
                throw new NotFoundError('Movimento de contrato não encontrado');
            }

            const contractMovementDTO = ContractMovementDetailedDTO.fromEntity(contractMovement);

            return contractMovementDTO;
        } catch (error) {
            logger.error('Erro ao atualizar movimento de contrato', { error });
            throw error;
        }
    }

    async delete(contract_id, movement_id) {
        try {
            const validatedId = ContractMovementValidator.findById({ contract_id, movement_id });

            const result = await this.repository.delete(validatedId);
            if (!result) {
                throw new NotFoundError('Movimento de contrato não encontrado');
            }

            return { message: 'Movimento de contrato removido com sucesso' };
        } catch (error) {
            logger.error('Erro ao remover movimento de contrato', { error });
            throw error;
        }
    }
}

module.exports = ContractMovementService;
