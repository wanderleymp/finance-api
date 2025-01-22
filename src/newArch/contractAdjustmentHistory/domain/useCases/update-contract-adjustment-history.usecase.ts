import { Injectable } from '@nestjs/common';
import { ContractAdjustmentHistoryRepositoryInterface } from '../repositories/contract-adjustment-history.repository.interface';
import { ContractAdjustmentHistoryEntity } from '../entities/contract-adjustment-history.entity';

@Injectable()
export class UpdateContractAdjustmentHistoryUseCase {
  constructor(
    private readonly repository: ContractAdjustmentHistoryRepositoryInterface
  ) {}

  async execute(
    id: number, 
    data: Partial<ContractAdjustmentHistoryEntity>
  ): Promise<ContractAdjustmentHistoryEntity> {
    // Validações básicas
    if (!id) {
      throw new Error('ID do histórico de ajuste é obrigatório');
    }

    // Verificar se o registro existe
    const existingHistory = await this.repository.findById(id);
    if (!existingHistory) {
      throw new Error('Histórico de ajuste não encontrado');
    }

    // Atualizar o registro
    try {
      const updatedHistory = await this.repository.update(id, data);
      return updatedHistory;
    } catch (error) {
      console.error('Erro ao atualizar histórico de ajuste:', error);
      throw error;
    }
  }
}
