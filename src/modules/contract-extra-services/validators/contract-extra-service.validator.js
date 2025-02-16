const ContractExtraServiceSchema = require('../schemas/contract-extra-service.schema');

class ContractExtraServiceValidator {
    static get create() {
        return ContractExtraServiceSchema.create;
    }

    static get update() {
        return ContractExtraServiceSchema.update;
    }

    static get get() {
        return ContractExtraServiceSchema.get;
    }

    static validateCreate(data) {
        return ContractExtraServiceSchema.validateCreate(data);
    }

    static validateUpdate(data) {
        return ContractExtraServiceSchema.validateUpdate(data);
    }

    static validateGet(data) {
        return ContractExtraServiceSchema.validateGet(data);
    }
}

module.exports = ContractExtraServiceValidator;
