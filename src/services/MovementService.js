const PrismaMovementRepository = require('../repositories/implementations/PrismaMovementRepository');
const logger = require('../../config/logger');

class MovementService {
    constructor(repository = new PrismaMovementRepository()) {
        this.repository = repository;
    }

    async createMovement(data, userId) {
        try {
            logger.info('[Service] Creating movement:', { data, userId });

            // Validações básicas
            if (!data.movement_date) throw new Error('movement_date is required');
            if (!data.person_id) throw new Error('person_id is required');
            if (!data.total_amount) throw new Error('total_amount is required');
            if (!data.license_id) throw new Error('license_id is required');
            
            // Garantir que total_amount seja positivo
            if (data.total_amount <= 0) {
                throw new Error('total_amount must be greater than 0');
            }

            const movement = await this.repository.createMovement({
                ...data,
                movement_date: new Date(data.movement_date),
                total_amount: parseFloat(data.total_amount),
                discount: data.discount ? parseFloat(data.discount) : 0,
                addition: data.addition ? parseFloat(data.addition) : 0,
                total_items: data.total_items ? parseFloat(data.total_items) : 0
            });
            return movement;
        } catch (error) {
            logger.error('[Service] Error creating movement:', error);
            throw error;
        }
    }

    async getMovementById(id, userId) {
        try {
            logger.info('[Service] Getting movement by id:', { id, userId });

            const movement = await this.repository.getMovementById(id);
            if (!movement) {
                throw new Error('Movement not found');
            }

            return movement;
        } catch (error) {
            logger.error('[Service] Error fetching movement:', error);
            throw error;
        }
    }

    async getAllMovements(filters = {}, page = 1, limit = 10, sort = { field: 'movement_date', order: 'desc' }, userId) {
        try {
            logger.info('[Service] Getting all movements:', { filters, page, limit, sort, userId });

            // Validar e ajustar parâmetros
            const validatedPage = Math.max(1, page);
            const validatedLimit = Math.min(100, Math.max(1, limit));
            const skip = (validatedPage - 1) * validatedLimit;

            // Validar ordenação
            const allowedSortFields = ['movement_date', 'total_amount', 'created_at', 'updated_at'];
            const validatedSort = {
                field: allowedSortFields.includes(sort.field) ? sort.field : 'movement_date',
                order: ['asc', 'desc'].includes(sort.order) ? sort.order : 'desc'
            };

            const result = await this.repository.getAllMovements(
                filters, 
                skip, 
                validatedLimit,
                validatedSort
            );

            // Adicionar metadados extras
            return {
                data: result.data.map(movement => ({
                    ...movement,
                    formatted_date: movement.movement_date.toLocaleDateString(),
                    formatted_amount: new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    }).format(movement.total_amount)
                })),
                pagination: {
                    ...result.pagination,
                    nextPage: result.pagination.hasNext ? validatedPage + 1 : null,
                    previousPage: result.pagination.hasPrevious ? validatedPage - 1 : null
                },
                filters: {
                    applied: filters,
                    available: {
                        sortFields: allowedSortFields,
                        sortOrders: ['asc', 'desc']
                    }
                }
            };
        } catch (error) {
            logger.error('[Service] Error fetching movements:', error);
            throw error;
        }
    }

    async updateMovement(id, data, userId) {
        try {
            logger.info('[Service] Updating movement:', { id, data, userId });

            // Validar total_amount se fornecido
            if (data.total_amount && data.total_amount <= 0) {
                throw new Error('total_amount must be greater than 0');
            }

            const updateData = {
                ...data,
                movement_date: data.movement_date ? new Date(data.movement_date) : undefined,
                total_amount: data.total_amount ? parseFloat(data.total_amount) : undefined,
                discount: data.discount ? parseFloat(data.discount) : undefined,
                addition: data.addition ? parseFloat(data.addition) : undefined,
                total_items: data.total_items ? parseFloat(data.total_items) : undefined
            };

            const movement = await this.repository.updateMovement(id, updateData);
            if (!movement) {
                throw new Error('Movement not found');
            }

            return movement;
        } catch (error) {
            logger.error('[Service] Error updating movement:', error);
            throw error;
        }
    }

    async deleteMovement(id, userId) {
        try {
            logger.info('[Service] Deleting movement:', { id, userId });

            const result = await this.repository.deleteMovement(id);
            if (!result) {
                throw new Error('Movement not found');
            }

            return result;
        } catch (error) {
            logger.error('[Service] Error deleting movement:', error);
            throw error;
        }
    }
}

module.exports = MovementService;
