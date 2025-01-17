class ContractGroupCreateDTO {
    constructor(data) {
        this.group_name = data.group_name;
        this.group_description = data.group_description || null;
        this.has_decimo_terceiro = data.has_decimo_terceiro || false;
        this.vencimento1_dia = data.vencimento1_dia || null;
        this.vencimento1_mes = data.vencimento1_mes || null;
        this.vencimento2_dia = data.vencimento2_dia || null;
        this.vencimento2_mes = data.vencimento2_mes || null;
        this.decimo_payment_method_id = data.decimo_payment_method_id || 4;
    }

    static fromEntity(entity) {
        return new ContractGroupCreateDTO(entity);
    }
}

module.exports = ContractGroupCreateDTO;
