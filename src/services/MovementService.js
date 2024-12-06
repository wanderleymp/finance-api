const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');
const prisma = new PrismaClient();

class MovementService {
    async createMovement(data, userId) {
        try {
            logger.info('[MovementService] Iniciando criação de movimento:', { 
                data, 
                userId 
            });

            // Validar campos obrigatórios
            const requiredFields = ['person_id', 'movement_type_id', 'total_amount', 'license_id'];
            for (const field of requiredFields) {
                if (!data[field]) {
                    logger.error(`[MovementService] Campo ${field} é obrigatório`, { data });
                    throw new Error(`Campo ${field} é obrigatório`);
                }
            }

            // Validar itens
            if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
                logger.error('[MovementService] Itens inválidos ou ausentes', { items: data.items });
                throw new Error('Itens da venda são obrigatórios');
            }

            // Iniciar transação
            const movement = await prisma.$transaction(async (tx) => {
                // Criar movimento
                const createdMovement = await tx.movement.create({
                    data: {
                        person_id: data.person_id,
                        movement_type_id: data.movement_type_id,
                        movement_date: data.movement_date || new Date(),
                        total_amount: data.total_amount,
                        total_items: data.total_items || data.items.length,
                        license_id: data.license_id,
                        description: data.description || 'Movimento de venda',
                        user_id: userId
                    }
                });

                logger.info('[MovementService] Movimento criado:', { 
                    movement_id: createdMovement.movement_id 
                });

                // Criar itens do movimento
                const movementItems = await Promise.all(data.items.map(async (item) => {
                    logger.info('[MovementService] Criando item de movimento:', { 
                        movement_id: createdMovement.movement_id,
                        item 
                    });

                    const createdItem = await tx.movement_item.create({
                        data: {
                            movement_id: createdMovement.movement_id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            unit_value: item.unit_value
                        }
                    });

                    logger.info('[MovementService] Item de movimento criado:', { 
                        movement_item_id: createdItem.movement_item_id 
                    });

                    return createdItem;
                }));

                logger.info('[MovementService] Itens do movimento criados:', { 
                    movement_id: createdMovement.movement_id,
                    items_count: movementItems.length 
                });

                return {
                    ...createdMovement,
                    items: movementItems
                };
            });

            logger.info('[MovementService] Movimento completo criado:', { 
                movement_id: movement.movement_id 
            });

            return movement;
        } catch (error) {
            logger.error('[MovementService] Erro ao criar movimento:', { 
                error: error.message, 
                stack: error.stack,
                data 
            });
            throw error;
        }
    }

    async getMovementById(id, userId) {
        try {
            logger.info('[Service] Getting movement by id:', { id, userId });

            const movement = await prisma.movement.findUnique({
                where: { movement_id: id },
                include: {
                    items: true
                }
            });
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

            const result = await prisma.movement.findMany({
                where: filters,
                skip,
                take: validatedLimit,
                orderBy: {
                    [validatedSort.field]: validatedSort.order
                },
                include: {
                    items: true
                }
            });

            // Adicionar metadados extras
            return {
                data: result.map(movement => ({
                    ...movement,
                    formatted_date: movement.movement_date.toLocaleDateString(),
                    formatted_amount: new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    }).format(movement.total_amount)
                })),
                pagination: {
                    hasNext: validatedPage * validatedLimit < result.length,
                    hasPrevious: validatedPage > 1,
                    nextPage: result.length > validatedPage * validatedLimit ? validatedPage + 1 : null,
                    previousPage: validatedPage > 1 ? validatedPage - 1 : null
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

            const movement = await prisma.movement.update({
                where: { movement_id: id },
                data: updateData,
                include: {
                    items: true
                }
            });
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

            const result = await prisma.movement.delete({
                where: { movement_id: id }
            });
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
