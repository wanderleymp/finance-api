class IMovementRepository {
    async createMovement(data) {
        throw new Error('Method not implemented');
    }

    async getMovementById(id) {
        throw new Error('Method not implemented');
    }

    async getAllMovements(filters = {}, skip = 0, take = 10) {
        throw new Error('Method not implemented');
    }

    async updateMovement(id, data) {
        throw new Error('Method not implemented');
    }

    async deleteMovement(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementRepository;
