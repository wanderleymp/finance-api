const { logger } = require('../../../middlewares/logger');
const { NotFoundError, BusinessError, ValidationError } = require('../../../utils/errors');
const ContractGroupRepository = require('../repository/contract-group.repository');
const ContractGroupValidator = require('../validators/contract-group.validator');
const CreateContractGroupDTO = require('../dto/contract-group-create.dto');
const ContractGroupDetailedDTO = require('../dto/contract-group-detailed.dto');

class ContractGroupService {
    constructor() {
        this.repository = new ContractGroupRepository();
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const validatedFilters = ContractGroupValidator.findAll({ ...filters, page, limit });

            const result = await this.repository.findAll(validatedFilters, page, limit);

            return result;
        } catch (error) {
            logger.error('Erro ao listar grupos de contrato', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            const validatedId = ContractGroupValidator.findById({ id });

            const contractGroup = await this.repository.findById(validatedId.id);
            if (!contractGroup) {
                throw new NotFoundError('Grupo de contrato não encontrado');
            }

            // Transforma em DTO
            const contractGroupDTO = ContractGroupDetailedDTO.fromEntity(contractGroup);

            return contractGroupDTO;
        } catch (error) {
            logger.error('Erro ao buscar grupo de contrato por ID', { error });
            throw error;
        }
    }

    async create(data) {
        try {
            const validatedData = ContractGroupValidator.create(data);
            const contractGroup = await this.repository.create(validatedData);

            // Transforma em DTO
            const contractGroupDTO = ContractGroupDetailedDTO.fromEntity(contractGroup);

            return contractGroupDTO;
        } catch (error) {
            logger.error('Erro ao criar grupo de contrato', { error });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const validatedData = ContractGroupValidator.update({ ...data, id });
            const contractGroup = await this.repository.update(id, validatedData);

            if (!contractGroup) {
                throw new NotFoundError('Grupo de contrato não encontrado');
            }

            // Transforma em DTO
            const contractGroupDTO = ContractGroupDetailedDTO.fromEntity(contractGroup);

            return contractGroupDTO;
        } catch (error) {
            logger.error('Erro ao atualizar grupo de contrato', { error });
            throw error;
        }
    }

    async delete(id) {
        try {
            // Verifica se existe
            const existingGroup = await this.repository.findById(id);
            if (!existingGroup) {
                throw new NotFoundError('Grupo de contrato não encontrado');
            }

            await this.repository.delete(id);

            return true;
        } catch (error) {
            logger.error('Erro ao remover grupo de contrato', { error });
            throw error;
        }
    }
}

module.exports = ContractGroupService;
