class IBoletoRepository {
    async create(data) {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findAll(filters = {}, skip = 0, take = 10) {
        throw new Error('Method not implemented');
    }

    async update(id, data) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }

    async generateBoletoWebhook(params) {
        throw new Error('Method not implemented');
    }
}

module.exports = IBoletoRepository;
