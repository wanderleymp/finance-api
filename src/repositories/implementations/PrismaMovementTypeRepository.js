const { PrismaClient } = require('@prisma/client');
const IMovementTypeRepository = require('../interfaces/IMovementTypeRepository');
const logger = require('../../../config/logger');

class PrismaMovementTypeRepository extends IMovementTypeRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient();
    }

    async getAllMovementTypes(filters = {}, skip = 0, take = 10) {
        try {
            const where = { ...filters };

            // Buscar o total de registros
            const total = await this.prisma.movement_types.count({ where });

            // Buscar os registros da página atual
            const movementTypes = await this.prisma.movement_types.findMany({
                where,
                skip,
                take,
                orderBy: { type_name: 'asc' },
                include: {
                    _count: {
                        select: {
                            movements: true,
                            movement_statuses: true
                        }
                    }
                }
            });

            // Calcular metadados da paginação
            const totalPages = Math.ceil(total / take);
            const currentPage = Math.floor(skip / take) + 1;
            const hasNext = currentPage < totalPages;
            const hasPrevious = currentPage > 1;

            return {
                data: movementTypes,
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
            logger.error('Error fetching movement types:', error);
            throw error;
        }
    }

    async getMovementTypeById(id) {
        try {
            const movementType = await this.prisma.movement_types.findUnique({
                where: { movement_type_id: parseInt(id) },
                include: {
                    _count: {
                        select: {
                            movements: true,
                            movement_statuses: true
                        }
                    }
                }
            });

            return movementType;
        } catch (error) {
            logger.error(`Error fetching movement type ${id}:`, error);
            throw error;
        }
    }

    async getMovementTypeByName(name) {
        try {
            const movementType = await this.prisma.movement_types.findUnique({
                where: { type_name: name }
            });

            return movementType;
        } catch (error) {
            logger.error(`Error fetching movement type by name ${name}:`, error);
            throw error;
        }
    }

    async createMovementType(data) {
        try {
            // Verificar se já existe um tipo de movimento com o mesmo nome
            const existing = await this.getMovementTypeByName(data.type_name);
            if (existing) {
                throw new Error('Movement type with this name already exists');
            }

            const movementType = await this.prisma.movement_types.create({
                data: {
                    type_name: data.type_name
                },
                include: {
                    _count: {
                        select: {
                            movements: true,
                            movement_statuses: true
                        }
                    }
                }
            });

            return movementType;
        } catch (error) {
            logger.error('Error creating movement type:', error);
            throw error;
        }
    }

    async updateMovementType(id, data) {
        try {
            // Verificar se já existe outro tipo de movimento com o mesmo nome
            if (data.type_name) {
                const existing = await this.getMovementTypeByName(data.type_name);
                if (existing && existing.movement_type_id !== parseInt(id)) {
                    throw new Error('Movement type with this name already exists');
                }
            }

            const movementType = await this.prisma.movement_types.update({
                where: { movement_type_id: parseInt(id) },
                data: {
                    type_name: data.type_name
                },
                include: {
                    _count: {
                        select: {
                            movements: true,
                            movement_statuses: true
                        }
                    }
                }
            });

            return movementType;
        } catch (error) {
            logger.error(`Error updating movement type ${id}:`, error);
            throw error;
        }
    }

    async deleteMovementType(id) {
        try {
            // Verificar se existem relacionamentos
            const movementType = await this.getMovementTypeById(id);
            if (!movementType) {
                throw new Error('Movement type not found');
            }

            if (movementType._count.movements > 0) {
                throw new Error('Cannot delete movement type with associated movements');
            }

            if (movementType._count.movement_statuses > 0) {
                throw new Error('Cannot delete movement type with associated statuses');
            }

            await this.prisma.movement_types.delete({
                where: { movement_type_id: parseInt(id) }
            });
            
            return true;
        } catch (error) {
            logger.error(`Error deleting movement type ${id}:`, error);
            throw error;
        }
    }
}

module.exports = PrismaMovementTypeRepository;
