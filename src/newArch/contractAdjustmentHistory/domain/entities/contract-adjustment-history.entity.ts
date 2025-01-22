export interface ContractAdjustmentHistoryEntity {
    adjustmentHistoryId?: number;
    contractId: number;
    previousValue: number;
    newValue: number;
    changeDate?: Date;
    changeType: string;
    changedBy: number;
}
