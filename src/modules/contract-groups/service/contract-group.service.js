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
            ContractGroupValidator.validateFindAll({ ...filters, page, limit });

            const result = await this.repository.findAll(filters, page, limit);
            
            // Transforma em DTOs
            result.data = result.data.map(entity => ContractGroupDetailedDTO.fromEntity(entity));

            return result;
        } catch (error) {
            logger.error('Erro ao listar grupos de contrato', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            ContractGroupValidator.validateFindById({ id });

            const contractGroup = await this.repository.findById(id);
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
            ContractGroupValidator.validateCreate(data);
            const contractGroup = await this.repository.create(data);
            const contractGroupDTO = ContractGroupDetailedDTO.fromEntity(contractGroup);

            return contractGroupDTO;
        } catch (error) {
            logger.error('Erro ao criar grupo de contrato', { error });
            throw error;
        }
    }

    async update(id, data) {
        try {
            // Verifica se existe
            const existingGroup = await this.repository.findById(id);
            if (!existingGroup) {
                throw new NotFoundError('Grupo de contrato não encontrado');
            }

            ContractGroupValidator.validateUpdate(data);
            const updatedContractGroup = await this.repository.update(id, data);
            const contractGroupDTO = ContractGroupDetailedDTO.fromEntity(updatedContractGroup);

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
