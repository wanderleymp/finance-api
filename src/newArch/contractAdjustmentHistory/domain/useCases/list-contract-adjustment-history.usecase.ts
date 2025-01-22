import { ContractAdjustmentHistoryEntity } from '../entities/contract-adjustment-history.entity';
import { ContractAdjustmentHistoryRepositoryInterface } from '../repositories/contract-adjustment-history.repository.interface';

export class ListContractAdjustmentHistoryUseCase {
    constructor(
        private readonly contractAdjustmentHistoryRepository: ContractAdjustmentHistoryRepositoryInterface
    ) {}

    async execute(
        page = 1, 
        limit = 10, 
        filters: Partial<ContractAdjustmentHistoryEntity> = {}
    ): Promise<{
        data: ContractAdjustmentHistoryEntity[];
        total: number;
        page: number;
        limit: number;
    }> {
        return this.contractAdjustmentHistoryRepository.list(page, limit, filters);
    }
}
