const { PrismaClient } = require('@prisma/client');
const IMovementStatusRepository = require('../interfaces/IMovementStatusRepository');
const logger = require('../../../config/logger');

class PrismaMovementStatusRepository extends IMovementStatusRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient();
    }

    async getAllMovementStatuses(filters = {}, skip = 0, take = 10) {
        try {
            logger.info('[Repository] Getting all movement statuses with filters:', filters);
            
            const where = { ...filters };
            
            // Tratar o filtro active
            if (where.active === 'all') {
                delete where.active;
            } else if (where.active !== undefined) {
                where.active = where.active === true || where.active === 'true';
            }

            // Buscar o total de registros
            const total = await this.prisma.movement_statuses.count({ where });

            // Buscar os registros da página atual
            const movementStatuses = await this.prisma.movement_statuses.findMany({
                where,
                skip,
                take,
                orderBy: [
                    { display_order: 'asc' },
                    { status_name: 'asc' }
                ],
                include: {
                    movement_types: {
                        select: {
                            type_name: true
                        }
                    },
                    movement_status_categories: {
                        select: {
                            category_name: true
                        }
                    },
                    _count: {
                        select: {
                            movements: true
                        }
                    }
                }
            });

            // Calcular metadados da paginação
            const totalPages = Math.ceil(total / take);
            const currentPage = Math.floor(skip / take) + 1;
            const hasNext = currentPage < totalPages;
            const hasPrevious = currentPage > 1;

            logger.info(`[Repository] Found ${total} movement statuses`);
            
            return {
                data: movementStatuses,
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
            logger.error('[Repository] Error fetching movement statuses:', error);
            throw error;
        }
    }

    async getMovementStatusById(id) {
        try {
            logger.info(`[Repository] Getting movement status by ID: ${id}`);
            
            const movementStatus = await this.prisma.movement_statuses.findUnique({
                where: { movement_status_id: parseInt(id) },
                include: {
                    movement_types: {
                        select: {
                            type_name: true
                        }
                    },
                    movement_status_categories: {
                        select: {
                            category_name: true
                        }
                    },
                    _count: {
                        select: {
                            movements: true
                        }
                    }
                }
            });

            if (movementStatus) {
                logger.info(`[Repository] Found movement status ${id}`);
            } else {
                logger.warn(`[Repository] Movement status ${id} not found`);
            }

            return movementStatus;
        } catch (error) {
            logger.error(`[Repository] Error fetching movement status ${id}:`, error);
            throw error;
        }
    }

    async getMovementStatusesByType(movementTypeId) {
        try {
            logger.info(`[Repository] Getting movement statuses for type: ${movementTypeId}`);
            
            const movementStatuses = await this.prisma.movement_statuses.findMany({
                where: { movement_type_id: parseInt(movementTypeId) },
                orderBy: [
                    { display_order: 'asc' },
                    { status_name: 'asc' }
                ],
                include: {
                    movement_status_categories: {
                        select: {
                            category_name: true
                        }
                    }
                }
            });

            logger.info(`[Repository] Found ${movementStatuses.length} statuses for type ${movementTypeId}`);
            return movementStatuses;
        } catch (error) {
            logger.error(`[Repository] Error fetching movement statuses for type ${movementTypeId}:`, error);
            throw error;
        }
    }

    async getMovementStatusByName(statusName, movementTypeId) {
        try {
            logger.info(`[Repository] Checking if status exists: ${statusName} for type ${movementTypeId}`);
            
            const movementStatus = await this.prisma.movement_statuses.findFirst({
                where: {
                    status_name: statusName,
                    movement_type_id: parseInt(movementTypeId)
                }
            });

            if (movementStatus) {
                logger.info(`[Repository] Found existing status: ${statusName} for type ${movementTypeId}`);
            }

            return movementStatus;
        } catch (error) {
            logger.error(`[Repository] Error checking movement status existence:`, error);
            throw error;
        }
    }

    async createMovementStatus(data) {
        try {
            logger.info('[Repository] Creating new movement status:', data);

            // Verificar se o tipo de movimento existe
            const movementType = await this.prisma.movement_types.findUnique({
                where: { movement_type_id: parseInt(data.movement_type_id) }
            });

            if (!movementType) {
                logger.warn(`[Repository] Movement type ${data.movement_type_id} not found`);
                throw new Error('Movement type not found');
            }

            // Verificar se a categoria existe
            const category = await this.prisma.movement_status_categories.findUnique({
                where: { status_category_id: parseInt(data.status_category_id) }
            });

            if (!category) {
                logger.warn(`[Repository] Status category ${data.status_category_id} not found`);
                throw new Error('Status category not found');
            }

            // Verificar se já existe um status com o mesmo nome para o mesmo tipo
            const existing = await this.getMovementStatusByName(data.status_name, data.movement_type_id);
            if (existing) {
                logger.warn(`[Repository] Status ${data.status_name} already exists for type ${data.movement_type_id}`);
                throw new Error('Movement status with this name already exists for this type');
            }

            const movementStatus = await this.prisma.movement_statuses.create({
                data: {
                    status_name: data.status_name,
                    description: data.description,
                    status_category_id: parseInt(data.status_category_id),
                    movement_type_id: parseInt(data.movement_type_id),
                    is_final: data.is_final === true,
                    display_order: data.display_order ? parseInt(data.display_order) : null,
                    active: data.active === undefined ? true : data.active === true
                },
                include: {
                    movement_types: {
                        select: {
                            type_name: true
                        }
                    },
                    movement_status_categories: {
                        select: {
                            category_name: true
                        }
                    }
                }
            });

            logger.info(`[Repository] Movement status created successfully with ID: ${movementStatus.movement_status_id}`);
            return movementStatus;
        } catch (error) {
            logger.error('[Repository] Error creating movement status:', error);
            throw error;
        }
    }

    async updateMovementStatus(id, data) {
        try {
            // Validar ID
            if (!id || id <= 0) {
                logger.warn(`[Repository] Invalid movement status ID: ${id}`);
                throw new Error('Invalid movement status ID');
            }

            logger.info(`[Repository] Checking if movement status ${id} exists`);
            
            // Verificar se o status existe
            const existing = await this.getMovementStatusById(id);
            if (!existing) {
                logger.warn(`[Repository] Movement status ${id} not found`);
                throw new Error('Movement status not found');
            }

            // Se estiver alterando o tipo de movimento, verificar se existe
            if (data.movement_type_id) {
                const movementType = await this.prisma.movement_types.findUnique({
                    where: { movement_type_id: parseInt(data.movement_type_id) }
                });

                if (!movementType) {
                    logger.warn(`[Repository] Movement type ${data.movement_type_id} not found`);
                    throw new Error('Movement type not found');
                }
            }

            // Se estiver alterando a categoria, verificar se existe
            if (data.status_category_id) {
                const category = await this.prisma.movement_status_categories.findUnique({
                    where: { status_category_id: parseInt(data.status_category_id) }
                });

                if (!category) {
                    logger.warn(`[Repository] Status category ${data.status_category_id} not found`);
                    throw new Error('Status category not found');
                }
            }

            // Se estiver alterando o nome, verificar se já existe para o mesmo tipo
            if (data.status_name) {
                const typeId = data.movement_type_id ? parseInt(data.movement_type_id) : existing.movement_type_id;
                const existingWithName = await this.getMovementStatusByName(data.status_name, typeId);
                if (existingWithName && existingWithName.movement_status_id !== parseInt(id)) {
                    logger.warn(`[Repository] Status ${data.status_name} already exists for type ${typeId}`);
                    throw new Error('Movement status with this name already exists for this type');
                }
            }

            const movementStatus = await this.prisma.movement_statuses.update({
                where: { movement_status_id: parseInt(id) },
                data: {
                    status_name: data.status_name,
                    description: data.description,
                    status_category_id: data.status_category_id ? parseInt(data.status_category_id) : undefined,
                    movement_type_id: data.movement_type_id ? parseInt(data.movement_type_id) : undefined,
                    is_final: data.is_final !== undefined ? data.is_final === true : undefined,
                    display_order: data.display_order ? parseInt(data.display_order) : undefined,
                    active: data.active !== undefined ? data.active === true : undefined
                },
                include: {
                    movement_types: {
                        select: {
                            type_name: true
                        }
                    },
                    movement_status_categories: {
                        select: {
                            category_name: true
                        }
                    }
                }
            });

            logger.info(`[Repository] Movement status ${id} updated successfully`);
            return movementStatus;
        } catch (error) {
            logger.error(`[Repository] Error updating movement status ${id}. Error:`, error);
            logger.error(`[Repository] Update data:`, data);
            throw error;
        }
    }

    async deleteMovementStatus(id) {
        try {
            logger.info(`[Repository] Attempting to delete movement status ${id}`);

            // Verificar se o status existe
            const movementStatus = await this.getMovementStatusById(id);
            if (!movementStatus) {
                logger.warn(`[Repository] Movement status ${id} not found`);
                throw new Error('Movement status not found');
            }

            // Verificar se existem movimentos usando este status
            if (movementStatus._count.movements > 0) {
                logger.warn(`[Repository] Cannot delete status ${id} - has ${movementStatus._count.movements} movements`);
                throw new Error('Cannot delete movement status with associated movements');
            }

            await this.prisma.movement_statuses.delete({
                where: { movement_status_id: parseInt(id) }
            });

            logger.info(`[Repository] Movement status ${id} deleted successfully`);
            return true;
        } catch (error) {
            logger.error(`[Repository] Error deleting movement status ${id}:`, error);
            throw error;
        }
    }
}

module.exports = PrismaMovementStatusRepository;
