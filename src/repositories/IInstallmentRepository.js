class IInstallmentRepository {
    async findAll() {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async create(data) {
        throw new Error('Method not implemented');
    }

    async update(id, data) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }

    async findByPaymentId(paymentId) {
        throw new Error('Method not implemented');
    }

    async findByMovementId(movementId) {
        throw new Error('Method not implemented');
    }
}

module.exports = IInstallmentRepository;
