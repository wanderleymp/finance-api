class ContractMovementDetailedDTO {
    constructor(data) {
        this.contract_id = data.contract_id;
        this.movement_id = data.movement_id;
    }

    static fromEntity(entity) {
        return new ContractMovementDetailedDTO(entity);
    }
}

module.exports = ContractMovementDetailedDTO;
