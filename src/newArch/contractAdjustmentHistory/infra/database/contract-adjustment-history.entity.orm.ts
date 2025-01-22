import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ContractRecurring } from '../../../contractsRecurring/infra/database/contract-recurring.entity.orm';

@Entity('contract_adjustment_history')
export class ContractAdjustmentHistory {
    @PrimaryGeneratedColumn({ name: 'adjustment_history_id' })
    adjustmentHistoryId: number;

    @Column({ name: 'contract_id' })
    contractId: number;

    @Column('decimal', { 
        precision: 10, 
        scale: 2, 
        name: 'previous_value', 
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        }
    })
    previousValue: number;

    @Column('decimal', { 
        precision: 10, 
        scale: 2, 
        name: 'new_value',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        }
    })
    newValue: number;

    @Column({ 
        name: 'change_date', 
        type: 'timestamp', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    changeDate: Date;

    @Column({ 
        name: 'change_type', 
        length: 50 
    })
    changeType: string;

    @Column({ name: 'changed_by' })
    changedBy: number;

    @ManyToOne(() => ContractRecurring, contract => contract.adjustmentHistories)
    @JoinColumn({ name: 'contract_id' })
    contract: ContractRecurring;
}
