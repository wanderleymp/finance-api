import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ContractAdjustmentHistory } from '../../../contractAdjustmentHistory/infra/database/contract-adjustment-history.entity.orm';

@Entity('contracts_recurring')
export class ContractRecurring {
    @PrimaryGeneratedColumn({ name: 'contract_id' })
    contractId: number;

    @Column({ name: 'contract_name', length: 255 })
    contractName: string;

    @Column('decimal', { precision: 10, scale: 2, name: 'contract_value' })
    contractValue: number;

    @Column({ name: 'start_date', type: 'date' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'date', nullable: true })
    endDate?: Date;

    @Column({ name: 'recurrence_period', length: 50 })
    recurrencePeriod: string;

    @Column({ name: 'due_day' })
    dueDay: number;

    @Column({ name: 'days_before_due' })
    daysBeforeDue: number;

    @Column({ length: 20 })
    status: string;

    @Column({ name: 'model_movement_id' })
    modelMovementId: number;

    @Column({ name: 'last_billing_date', type: 'date', nullable: true })
    lastBillingDate?: Date;

    @Column({ name: 'next_billing_date', type: 'date', nullable: true })
    nextBillingDate?: Date;

    @Column({ name: 'contract_group_id' })
    contractGroupId: number;

    @Column({ name: 'billing_reference', length: 50 })
    billingReference: string;

    @Column({ name: 'representative_person_id' })
    representativePersonId: number;

    @Column('decimal', { precision: 10, scale: 2, name: 'commissioned_value' })
    commissionedValue: number;

    @Column({ name: 'account_entry_id' })
    accountEntryId: number;

    @Column({ name: 'last_decimo_billing_year', nullable: true })
    lastDecimoBillingYear?: number;

    @OneToMany(() => ContractAdjustmentHistory, adjustmentHistory => adjustmentHistory.contract)
    adjustmentHistories: ContractAdjustmentHistory[];
}
