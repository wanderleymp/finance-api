const { PrismaClient } = require('@prisma/client');
const logger = require('../../../config/logger');

class PrismaMovementRepository {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async createMovement(data) {
        try {
            const movement = await this.prisma.movements.create({
                data: {
                    ...data,
                    movement_type_id: parseInt(data.movement_type_id)
                },
                include: {
                    persons: {
                        select: {
                            person_id: true,
                            name: true,
                            document: true,
                            email: true
                        }
                    },
                    movement_items: {
                        include: {
                            products: {
                                select: {
                                    product_id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    },
                    movement_payments: {
                        include: {
                            payment_methods: {
                                select: {
                                    payment_method_id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    movement_types: true
                }
            });

            return movement;
        } catch (error) {
            logger.error('Error creating movement:', error);
            throw error;
        }
    }

    async getMovementById(id) {
        try {
            const movement = await this.prisma.movements.findUnique({
                where: { movement_id: parseInt(id) },
                include: {
                    persons: {
                        select: {
                            person_id: true,
                            name: true,
                            document: true,
                            email: true
                        }
                    },
                    movement_items: {
                        include: {
                            products: {
                                select: {
                                    product_id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    },
                    movement_payments: {
                        include: {
                            payment_methods: {
                                select: {
                                    payment_method_id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    movement_types: true
                }
            });

            return movement;
        } catch (error) {
            logger.error('Error fetching movement:', error);
            throw error;
        }
    }

    async getAllMovements(filters = {}, skip = 0, take = 10, sort = { field: 'movement_date', order: 'desc' }) {
        try {
            // Construir a cláusula where baseada nos filtros
            const where = {
                ...filters
            };

            // Tratar filtros especiais
            if (where.movement_date) {
                where.movement_date = {
                    gte: where.movement_date.gte,
                    lte: where.movement_date.lte
                };
            }

            if (where.total_amount) {
                where.total_amount = {
                    gte: where.total_amount.gte,
                    lte: where.total_amount.lte
                };
            }

            // Construir ordenação
            const orderBy = {
                [sort.field]: sort.order
            };

            // Buscar o total de registros
            const total = await this.prisma.movements.count({ where });

            // Buscar os registros da página atual
            const movements = await this.prisma.movements.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    persons: {
                        select: {
                            person_id: true,
                            name: true,
                            document: true,
                            email: true
                        }
                    },
                    movement_items: {
                        include: {
                            products: {
                                select: {
                                    product_id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    },
                    movement_payments: {
                        include: {
                            payment_methods: {
                                select: {
                                    payment_method_id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    movement_types: true
                }
            });

            // Calcular metadados da paginação
            const totalPages = Math.ceil(total / take);
            const currentPage = Math.floor(skip / take) + 1;
            const hasNext = currentPage < totalPages;
            const hasPrevious = currentPage > 1;

            return {
                data: movements,
                pagination: {
                    total,
                    totalPages,
                    currentPage,
                    perPage: take,
                    hasNext,
                    hasPrevious
                }
            };
        } catch (error) {
            logger.error('Error fetching movements:', error);
            throw error;
        }
    }

    async updateMovement(id, data) {
        try {
            const updateData = {
                ...data
            };

            const movement = await this.prisma.movements.update({
                where: { movement_id: parseInt(id) },
                data: updateData,
                include: {
                    persons: {
                        select: {
                            person_id: true,
                            name: true,
                            document: true,
                            email: true
                        }
                    },
                    movement_items: {
                        include: {
                            products: {
                                select: {
                                    product_id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    },
                    movement_payments: {
                        include: {
                            payment_methods: {
                                select: {
                                    payment_method_id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    movement_types: true
                }
            });

            return movement;
        } catch (error) {
            logger.error('Error updating movement:', error);
            throw error;
        }
    }

    async deleteMovement(id) {
        try {
            await this.prisma.movements.delete({
                where: { movement_id: parseInt(id) }
            });

            return true;
        } catch (error) {
            logger.error('Error deleting movement:', error);
            throw error;
        }
    }
}

module.exports = PrismaMovementRepository;
