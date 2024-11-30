class IMovementTypeRepository {
    async getAllMovementTypes(filters = {}, skip = 0, take = 10) {
        throw new Error('Method not implemented');
    }

    async getMovementTypeById(id) {
        throw new Error('Method not implemented');
    }

    async createMovementType(data) {
        throw new Error('Method not implemented');
    }

    async updateMovementType(id, data) {
        throw new Error('Method not implemented');
    }

    async deleteMovementType(id) {
        throw new Error('Method not implemented');
    }

    async getMovementTypeByName(name) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementTypeRepository;
