class IPaymentMethodRepository {
    async getAllPaymentMethods(filters = {}, skip = 0, take = 10) {
        throw new Error('Method not implemented');
    }

    async getPaymentMethodById(id) {
        throw new Error('Method not implemented');
    }

    async createPaymentMethod(data) {
        throw new Error('Method not implemented');
    }

    async updatePaymentMethod(id, data) {
        throw new Error('Method not implemented');
    }

    async deletePaymentMethod(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = IPaymentMethodRepository;
