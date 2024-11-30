class IMovementStatusRepository {
    async getAllMovementStatuses(filters = {}, skip = 0, take = 10) {
        throw new Error('Method not implemented');
    }

    async getMovementStatusById(id) {
        throw new Error('Method not implemented');
    }

    async getMovementStatusesByType(movementTypeId) {
        throw new Error('Method not implemented');
    }

    async getMovementStatusByName(statusName, movementTypeId) {
        throw new Error('Method not implemented');
    }

    async createMovementStatus(data) {
        throw new Error('Method not implemented');
    }

    async updateMovementStatus(id, data) {
        throw new Error('Method not implemented');
    }

    async deleteMovementStatus(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementStatusRepository;
