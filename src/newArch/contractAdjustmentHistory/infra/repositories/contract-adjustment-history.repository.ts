import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractAdjustmentHistory } from '../database/contract-adjustment-history.entity.orm';
import { ContractAdjustmentHistoryRepositoryInterface } from '../../domain/repositories/contract-adjustment-history.repository.interface';
import { ContractAdjustmentHistoryEntity } from '../../domain/entities/contract-adjustment-history.entity';

@Injectable()
export class ContractAdjustmentHistoryRepository implements ContractAdjustmentHistoryRepositoryInterface {
    constructor(
        @InjectRepository(ContractAdjustmentHistory)
        private readonly repository: Repository<ContractAdjustmentHistory>
    ) {}

    async create(data: ContractAdjustmentHistoryEntity): Promise<ContractAdjustmentHistoryEntity> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async findById(id: number): Promise<ContractAdjustmentHistoryEntity | null> {
        return this.repository.findOne({ 
            where: { adjustmentHistoryId: id },
            relations: ['contract']
        });
    }

    async findByContractId(contractId: number): Promise<ContractAdjustmentHistoryEntity[]> {
        return this.repository.find({ 
            where: { contractId },
            order: { changeDate: 'DESC' },
            relations: ['contract']
        });
    }

    async update(
        id: number, 
        data: Partial<ContractAdjustmentHistoryEntity>
    ): Promise<ContractAdjustmentHistoryEntity> {
        await this.repository.update(id, data);
        return this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected > 0;
    }

    async list(
        page = 1, 
        limit = 10, 
        filters: Partial<ContractAdjustmentHistoryEntity> = {}
    ): Promise<{
        data: ContractAdjustmentHistoryEntity[];
        total: number;
        page: number;
        limit: number;
    }> {
        const [data, total] = await this.repository.findAndCount({
            where: filters,
            skip: (page - 1) * limit,
            take: limit,
            order: { changeDate: 'DESC' },
            relations: ['contract']
        });

        return {
            data,
            total,
            page,
            limit
        };
    }
}
