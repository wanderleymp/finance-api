const IMovementItemService = require('./interfaces/IMovementItemService');
const MovementItemRepository = require('./movement-item.repository');
const MovementItemDTO = require('./dto/movement-item.dto');
const MovementItemValidator = require('./validators/movement-item.validator');
const { NotFoundError } = require('../../utils/errors');
const { systemDatabase } = require('../../config/database');

class MovementItemService extends IMovementItemService {
    constructor() {
        super();
        this.repository = new MovementItemRepository();
    }

    async create(data, options = {}) {
        await MovementItemValidator.validateCreate(data);

        // Calcula o total_price se não fornecido
        if (!data.total_price) {
            data.total_price = Number((data.quantity * data.unit_price).toFixed(2));
        }

        const item = await this.repository.create(data, options);
        return MovementItemDTO.fromEntity(item);
    }

    async update(id, data, options = {}) {
        await MovementItemValidator.validateUpdate(data);

        const existingItem = await this.repository.findById(id);
        if (!existingItem) {
            throw new NotFoundError('Item de movimentação não encontrado');
        }

        // Se quantidade ou preço unitário foram atualizados, recalcula o total
        if (data.quantity || data.unit_price) {
            const quantity = data.quantity || existingItem.quantity;
            const unitPrice = data.unit_price || existingItem.unit_price;
            data.total_price = Number((quantity * unitPrice).toFixed(2));
        }

        const item = await this.repository.update(id, data);
        
        // Atualiza o total do movimento apenas se skipTotalUpdate não for true
        if (!options.skipTotalUpdate) {
            await this.repository.updateMovementTotal(existingItem.movement_id, options.client);
        }
        
        return MovementItemDTO.fromEntity(item);
    }

    async findById(id) {
        await MovementItemValidator.validateId({ id });

        const item = await this.repository.findById(id);
        if (!item) {
            throw new NotFoundError('Item de movimentação não encontrado');
        }

        return MovementItemDTO.fromEntity(item);
    }

    async findByMovementId(movementId) {
        await MovementItemValidator.validateId({ id: movementId });

        const items = await this.repository.findByMovementId(movementId);
        return items.map(item => MovementItemDTO.fromEntity(item));
    }

    async findAll(filters = {}) {
        const { page = 1, limit = 10, search = '', orderField, orderDirection } = filters;
        
        const results = await this.repository.findAll(
            { search },
            parseInt(page),
            parseInt(limit),
            { field: orderField, direction: orderDirection }
        );

        return {
            items: results.data,
            pagination: results.pagination
        };
    }

    async delete(id) {
        await MovementItemValidator.validateId({ id });

        const item = await this.repository.findById(id);
        if (!item) {
            throw new NotFoundError('Item de movimentação não encontrado');
        }

        await this.repository.delete(id);
        
        // Atualiza o total do movimento
        await this.repository.updateMovementTotal(item.movement_id);
    }
}

module.exports = MovementItemService;
