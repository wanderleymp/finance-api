import { ContractAdjustmentHistoryEntity } from '../entities/contract-adjustment-history.entity';

export interface ContractAdjustmentHistoryRepositoryInterface {
    create(data: ContractAdjustmentHistoryEntity): Promise<ContractAdjustmentHistoryEntity>;
    findById(id: number): Promise<ContractAdjustmentHistoryEntity | null>;
    findByContractId(contractId: number): Promise<ContractAdjustmentHistoryEntity[]>;
    update(id: number, data: Partial<ContractAdjustmentHistoryEntity>): Promise<ContractAdjustmentHistoryEntity>;
    delete(id: number): Promise<boolean>;
    list(page?: number, limit?: number, filters?: Partial<ContractAdjustmentHistoryEntity>): Promise<{
        data: ContractAdjustmentHistoryEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
}
