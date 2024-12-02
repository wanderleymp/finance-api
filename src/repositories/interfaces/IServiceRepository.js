class IServiceRepository {
    async getAllServices(filters = {}, skip = 0, take = 10) {
        throw new Error('Method not implemented');
    }

    async getServiceById(id) {
        throw new Error('Method not implemented');
    }

    async createService(data) {
        throw new Error('Method not implemented');
    }

    async updateService(id, data) {
        throw new Error('Method not implemented');
    }

    async deleteService(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = IServiceRepository;
