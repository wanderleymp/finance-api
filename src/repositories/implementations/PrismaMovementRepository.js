const { PrismaClient } = require('@prisma/client');
const IMovementRepository = require('../interfaces/IMovementRepository');
const logger = require('../../../config/logger');
const { MovementError, MovementNotFoundError } = require('../../utils/errors/MovementError');

class PrismaMovementRepository extends IMovementRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient({
            log: ['error', 'warn'],
            errorFormat: 'minimal'
        });
    }

    async createMovement(data) {
        try {
            const movement = await this.prisma.movements.create({
                data: {
                    movement_date: new Date(data.movement_date),
                    person_id: parseInt(data.person_id),
                    total_amount: parseFloat(data.total_amount),
                    description: data.description,
                    license_id: parseInt(data.license_id),
                    total_items: parseFloat(data.total_amount), 
                    movement_items: {
                        create: data.items.map(item => ({
                            item_id: parseInt(item.product_id),
                            quantity: parseFloat(item.quantity),
                            unit_price: parseFloat(item.unit_value),
                            total_price: parseFloat(item.quantity) * parseFloat(item.unit_value)
                        }))
                    }
                },
                select: {
                    movement_id: true,
                    movement_date: true,
                    total_amount: true,
                    description: true,
                    movement_type_id: true,
                    movement_status_id: true,
                    persons: {
                        select: {
                            person_id: true,
                            full_name: true,
                            fantasy_name: true,
                            person_documents: {
                                select: {
                                    document_value: true,
                                    document_types: {
                                        select: {
                                            description: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    movement_types: {
                        select: {
                            movement_type_id: true,
                            type_name: true
                        }
                    },
                    movement_statuses: {
                        select: {
                            movement_status_id: true,
                            status_name: true,
                            description: true
                        }
                    }
                }
            });

            logger.info('Movement created successfully', { movement_id: movement.movement_id });
            return movement;
        } catch (error) {
            logger.error('Error creating movement:', { error: error.message, stack: error.stack });
            if (error.code === 'P2002') {
                throw new MovementError('Unique constraint violation', 400);
            } else if (error.code === 'P2003') {
                throw new MovementError('Foreign key constraint violation', 400);
            }
            throw error;
        }
    }

    async getAllMovements(filters = {}, skip = 0, take = 10, sort = { field: 'movement_date', order: 'desc' }) {
        try {
            const where = {};

            if (filters.movement_date) {
                where.movement_date = {
                    gte: new Date(filters.movement_date.gte),
                    lte: new Date(filters.movement_date.lte)
                };
            }

            if (filters.total_amount) {
                where.total_amount = {
                    gte: parseFloat(filters.total_amount.gte),
                    lte: parseFloat(filters.total_amount.lte)
                };
            }

            if (filters.person_id) {
                where.person_id = parseInt(filters.person_id);
            }

            if (filters.license_id) {
                where.license_id = parseInt(filters.license_id);
            }

            if (filters.movement_type_id) {
                where.movement_type_id = parseInt(filters.movement_type_id);
            }

            if (filters.movement_status_id) {
                where.movement_status_id = parseInt(filters.movement_status_id);
            }

            if (filters.search) {
                where.OR = [
                    { description: { contains: filters.search, mode: 'insensitive' } },
                    { persons: { full_name: { contains: filters.search, mode: 'insensitive' } } },
                    { persons: { fantasy_name: { contains: filters.search, mode: 'insensitive' } } },
                    { persons: { 
                        person_documents: {
                            some: {
                                document_value: { contains: filters.search, mode: 'insensitive' }
                            }
                        }
                    }}
                ];
            }

            const [movements, total] = await Promise.all([
                this.prisma.movements.findMany({
                    where,
                    skip,
                    take,
                    orderBy: { [sort.field]: sort.order },
                    select: {
                        movement_id: true,
                        movement_date: true,
                        total_amount: true,
                        description: true,
                        movement_type_id: true,
                        movement_status_id: true,
                        persons: {
                            select: {
                                person_id: true,
                                full_name: true,
                                fantasy_name: true,
                                person_documents: {
                                    select: {
                                        document_value: true,
                                        document_types: {
                                            select: {
                                                description: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        movement_types: {
                            select: {
                                movement_type_id: true,
                                type_name: true
                            }
                        },
                        movement_statuses: {
                            select: {
                                movement_status_id: true,
                                status_name: true,
                                description: true
                            }
                        }
                    }
                }),
                this.prisma.movements.count({ where })
            ]);

            return {
                data: movements,
                pagination: {
                    total,
                    totalPages: Math.ceil(total / take),
                    currentPage: Math.floor(skip / take) + 1,
                    perPage: take,
                    hasNext: skip + take < total,
                    hasPrevious: skip > 0
                }
            };
        } catch (error) {
            logger.error('Error fetching movements:', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    async getMovementById(id) {
        try {
            const movement = await this.prisma.movements.findFirst({
                where: { 
                    movement_id: parseInt(id)
                },
                select: {
                    movement_id: true,
                    movement_date: true,
                    total_amount: true,
                    description: true,
                    movement_type_id: true,
                    movement_status_id: true,
                    persons: {
                        select: {
                            person_id: true,
                            full_name: true,
                            fantasy_name: true,
                            person_documents: {
                                select: {
                                    document_value: true,
                                    document_types: {
                                        select: {
                                            description: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    movement_types: {
                        select: {
                            movement_type_id: true,
                            type_name: true
                        }
                    },
                    movement_statuses: {
                        select: {
                            movement_status_id: true,
                            status_name: true,
                            description: true
                        }
                    }
                }
            });

            if (!movement) {
                throw new MovementNotFoundError(id);
            }

            return movement;
        } catch (error) {
            logger.error('Error fetching movement:', { 
                error: error.message, 
                movement_id: id 
            });
            throw error;
        }
    }

    async updateMovement(id, data) {
        try {
            const updateData = {
                ...(data.movement_date && { movement_date: new Date(data.movement_date) }),
                ...(data.person_id && { person_id: parseInt(data.person_id) }),
                ...(data.total_amount && { total_amount: parseFloat(data.total_amount) }),
                ...(data.description && { description: data.description }),
                ...(data.license_id && { license_id: parseInt(data.license_id) })
            };

            const movement = await this.prisma.movements.update({
                where: { movement_id: parseInt(id) },
                data: updateData,
                select: {
                    movement_id: true,
                    movement_date: true,
                    total_amount: true,
                    description: true,
                    movement_type_id: true,
                    movement_status_id: true,
                    persons: {
                        select: {
                            person_id: true,
                            full_name: true,
                            fantasy_name: true,
                            person_documents: {
                                select: {
                                    document_value: true,
                                    document_types: {
                                        select: {
                                            description: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    movement_types: {
                        select: {
                            movement_type_id: true,
                            type_name: true
                        }
                    },
                    movement_statuses: {
                        select: {
                            movement_status_id: true,
                            status_name: true,
                            description: true
                        }
                    }
                }
            });

            return movement;
        } catch (error) {
            logger.error('Error updating movement:', { error: error.message, movement_id: id });
            if (error.code === 'P2025') {
                throw new MovementNotFoundError(id);
            }
            throw error;
        }
    }

    async deleteMovement(id) {
        try {
            await this.prisma.movements.delete({
                where: { movement_id: parseInt(id) }
            });
        } catch (error) {
            logger.error('Error deleting movement:', { error: error.message, movement_id: id });
            if (error.code === 'P2025') {
                throw new MovementNotFoundError(id);
            }
            throw error;
        }
    }

    async getMovementHistory(id) {
        try {
            const history = await this.prisma.movement_status_history.findMany({
                where: { movement_id: parseInt(id) },
                orderBy: { changed_at: 'desc' },
                include: {
                    movement_statuses: true
                }
            });

            return history;
        } catch (error) {
            logger.error('Error fetching movement history:', { error: error.message, movement_id: id });
            throw error;
        }
    }
}

module.exports = PrismaMovementRepository;
