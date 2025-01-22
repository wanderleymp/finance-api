import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractAdjustmentHistory } from './database/contract-adjustment-history.entity.orm';
import { ContractAdjustmentHistoryRepository } from './repositories/contract-adjustment-history.repository';
import { CreateContractAdjustmentHistoryUseCase } from '../domain/useCases/create-contract-adjustment-history.usecase';
import { ListContractAdjustmentHistoryUseCase } from '../domain/useCases/list-contract-adjustment-history.usecase';
import { ContractAdjustmentHistoryController } from '../application/controllers/contract-adjustment-history.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([ContractAdjustmentHistory])
    ],
    controllers: [ContractAdjustmentHistoryController],
    providers: [
        ContractAdjustmentHistoryRepository,
        CreateContractAdjustmentHistoryUseCase,
        ListContractAdjustmentHistoryUseCase
    ],
    exports: [
        ContractAdjustmentHistoryRepository,
        CreateContractAdjustmentHistoryUseCase,
        ListContractAdjustmentHistoryUseCase
    ]
})
export class ContractAdjustmentHistoryModule {}
