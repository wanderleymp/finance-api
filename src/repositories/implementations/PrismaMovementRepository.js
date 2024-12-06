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
            logger.info('Getting all movements with filters:', { filters, skip, take, sort });
            
            const where = {};
            
            if (filters.movement_date_gte || filters.movement_date_lte) {
                where.movement_date = {};
                if (filters.movement_date_gte) {
                    where.movement_date.gte = new Date(filters.movement_date_gte);
                }
                if (filters.movement_date_lte) {
                    where.movement_date.lte = new Date(filters.movement_date_lte);
                }
            }

            if (filters.movement_type_id) {
                where.movement_type_id = filters.movement_type_id;
            }

            if (filters.movement_status_id) {
                where.movement_status_id = filters.movement_status_id;
            }

            if (filters.search) {
                where.OR = [
                    {
                        persons: {
                            OR: [
                                { full_name: { contains: filters.search, mode: 'insensitive' } },
                                { fantasy_name: { contains: filters.search, mode: 'insensitive' } }
                            ]
                        }
                    },
                    { description: { contains: filters.search, mode: 'insensitive' } }
                ];
            }

            logger.debug('Constructed where clause:', { where });

            const movements = await this.prisma.$transaction(async (prisma) => {
                const result = await prisma.movements.findMany({
                    where,
                    skip: Math.max(0, skip),
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
                        },
                        movement_payments: {
                            select: {
                                payment_id: true,
                                total_amount: true,
                                status: true,
                                payment_methods: {
                                    select: {
                                        payment_method_id: true,
                                        method_name: true,
                                        description: true,
                                        installment_count: true,
                                        days_between_installments: true,
                                        first_due_date_days: true
                                    }
                                },
                                installments: {
                                    select: {
                                        installment_id: true,
                                        due_date: true,
                                        balance: true,
                                        status: true
                                    }
                                }
                            }
                        }
                    }
                });

                logger.info('Successfully retrieved movements', { count: result.length });
                return result;
            });

            return movements;
        } catch (error) {
            logger.error('Error getting all movements:', { 
                error: error.message, 
                stack: error.stack,
                filters,
                skip,
                take,
                sort
            });
            throw error;
        }
    }

    async getMovementById(id) {
        try {
            logger.info('Getting movement by id:', { id });

            const movement = await this.prisma.$transaction(async (prisma) => {
                const result = await prisma.movements.findUnique({
                    where: { movement_id: parseInt(id) },
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
                        },
                        movement_payments: {
                            select: {
                                payment_id: true,
                                total_amount: true,
                                status: true,
                                payment_methods: {
                                    select: {
                                        payment_method_id: true,
                                        method_name: true,
                                        description: true,
                                        installment_count: true,
                                        days_between_installments: true,
                                        first_due_date_days: true
                                    }
                                },
                                installments: {
                                    select: {
                                        installment_id: true,
                                        due_date: true,
                                        balance: true,
                                        status: true
                                    }
                                }
                            }
                        }
                    }
                });

                if (!result) {
                    logger.warn('Movement not found:', { id });
                    throw new MovementNotFoundError(`Movement with id ${id} not found`);
                }

                logger.info('Successfully retrieved movement:', { id });
                return result;
            });

            return movement;
        } catch (error) {
            logger.error('Error getting movement by id:', { 
                error: error.message, 
                stack: error.stack,
                id 
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
