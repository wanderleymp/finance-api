class ContractRecurringDetailedDTO {
    static fromEntity(entity) {
        return {
            contract_id: entity.contract_id,
            contract_name: entity.contract_name,
            contract_value: entity.contract_value,
            start_date: entity.start_date,
            end_date: entity.end_date,
            recurrence_period: entity.recurrence_period,
            due_day: entity.due_day,
            days_before_due: entity.days_before_due,
            status: entity.status,
            model_movement_id: entity.model_movement_id,
            last_billing_date: entity.last_billing_date,
            next_billing_date: entity.next_billing_date,
            contract_group_id: entity.contract_group_id,
            billing_reference: entity.billing_reference,
            representative_person_id: entity.representative_person_id,
            commissioned_value: entity.commissioned_value,
            account_entry_id: entity.account_entry_id,
            last_decimo_billing_year: entity.last_decimo_billing_year,
            group_name: entity.group_name,
            full_name: entity.full_name
        };
    }
}

module.exports = ContractRecurringDetailedDTO;
