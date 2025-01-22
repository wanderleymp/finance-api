import { Injectable } from '@nestjs/common';
import { ContractAdjustmentHistoryRepositoryInterface } from '../repositories/contract-adjustment-history.repository.interface';

@Injectable()
export class DeleteContractAdjustmentHistoryUseCase {
  constructor(
    private readonly repository: ContractAdjustmentHistoryRepositoryInterface
  ) {}

  async execute(id: number): Promise<boolean> {
    // Validações básicas
    if (!id) {
      throw new Error('ID do histórico de ajuste é obrigatório');
    }

    // Verificar se o registro existe
    const existingHistory = await this.repository.findById(id);
    if (!existingHistory) {
      throw new Error('Histórico de ajuste não encontrado');
    }

    // Deletar o registro
    try {
      const deleted = await this.repository.delete(id);
      return deleted;
    } catch (error) {
      console.error('Erro ao deletar histórico de ajuste:', error);
      throw error;
    }
  }
}
