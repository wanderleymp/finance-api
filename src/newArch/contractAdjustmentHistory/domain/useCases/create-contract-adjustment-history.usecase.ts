import { ContractAdjustmentHistoryEntity } from '../entities/contract-adjustment-history.entity';
import { ContractAdjustmentHistoryRepositoryInterface } from '../repositories/contract-adjustment-history.repository.interface';

export class CreateContractAdjustmentHistoryUseCase {
    constructor(
        private readonly contractAdjustmentHistoryRepository: ContractAdjustmentHistoryRepositoryInterface
    ) {}

    async execute(data: ContractAdjustmentHistoryEntity): Promise<ContractAdjustmentHistoryEntity> {
        // Validações de negócio podem ser adicionadas aqui
        return this.contractAdjustmentHistoryRepository.create(data);
    }
}
