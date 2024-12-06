const { PrismaClient } = require('@prisma/client');
const IServiceRepository = require('../interfaces/IServiceRepository');
const logger = require('../../../config/logger');

class PrismaServiceRepository extends IServiceRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient();
    }

    async getAllServices(filters = {}, skip = 0, take = 10) {
        try {
            const where = {
                items: {
                    deleted_at: null,
                    active: true,
                    OR: filters.searchTerm ? [
                        { name: { contains: filters.searchTerm, mode: 'insensitive' } },
                        { description: { contains: filters.searchTerm, mode: 'insensitive' } }
                    ] : undefined
                },
                service_group_id: filters.service_group_id ? parseInt(filters.service_group_id) : undefined
            };

            // Contagem total
            const total = await this.prisma.services.count({
                where
            });

            // Buscar serviços
            const services = await this.prisma.services.findMany({
                where,
                select: {
                    items: {
                        select: {
                            item_id: true,
                            code: true,
                            name: true,
                            description: true,
                            price: true,
                            created_at: true,
                            updated_at: true,
                            active: true
                        }
                    },
                    service_group_id: true
                },
                skip: parseInt(skip),
                take: parseInt(take),
                orderBy: {
                    items: {
                        created_at: 'desc'
                    }
                }
            });

            // Formatar resultado
            const data = services.map(service => ({
                ...service.items,
                service_group_id: service.service_group_id
            }));

            return {
                data,
                pagination: {
                    total,
                    currentPage: Math.floor(skip / take) + 1,
                    totalPages: Math.ceil(total / take),
                    hasNext: Math.floor(skip / take) + 1 < Math.ceil(total / take),
                    hasPrevious: Math.floor(skip / take) + 1 > 1,
                    take,
                    skip
                }
            };

        } catch (error) {
            logger.error('Erro ao buscar serviços:', {
                message: error.message,
                filters,
                skip,
                take
            });
            throw error;
        }
    }

    async getServiceById(id) {
        try {
            const service = await this.prisma.services.findFirst({
                where: {
                    item_id: parseInt(id),
                    items: {
                        deleted_at: null,
                        active: true
                    }
                },
                select: {
                    items: {
                        select: {
                            item_id: true,
                            code: true,
                            name: true,
                            description: true,
                            price: true,
                            created_at: true,
                            updated_at: true,
                            active: true
                        }
                    },
                    service_group_id: true
                }
            });

            if (!service) return null;

            return {
                ...service.items,
                service_group_id: service.service_group_id
            };
        } catch (error) {
            logger.error('Erro ao buscar serviço:', {
                id,
                error: error.message
            });
            throw error;
        }
    }

    async createService(data) {
        try {
            // Verificar código duplicado
            const existingItem = await this.prisma.items.findFirst({
                where: {
                    code: data.code,
                    deleted_at: null
                }
            });

            if (existingItem) {
                throw new Error('Service code already exists');
            }

            // Criar serviço usando transação
            const result = await this.prisma.$transaction(async (prisma) => {
                // Criar item
                const item = await prisma.items.create({
                    data: {
                        code: data.code,
                        name: data.name,
                        description: data.description,
                        price: parseFloat(data.price),
                        active: true
                    }
                });

                // Criar serviço
                await prisma.services.create({
                    data: {
                        item_id: item.item_id,
                        service_group_id: data.service_group_id ? parseInt(data.service_group_id) : null
                    }
                });

                return item.item_id;
            });

            return this.getServiceById(result);
        } catch (error) {
            logger.error('Erro ao criar serviço:', {
                data,
                error: error.message
            });
            throw error;
        }
    }

    async updateService(id, data) {
        try {
            const service = await this.getServiceById(parseInt(id));
            if (!service) {
                throw new Error('Service not found');
            }

            // Verificar código duplicado
            if (data.code && data.code !== service.code) {
                const existingItem = await this.prisma.items.findFirst({
                    where: {
                        code: data.code,
                        item_id: { not: parseInt(id) },
                        deleted_at: null
                    }
                });

                if (existingItem) {
                    throw new Error('Service code already exists');
                }
            }

            // Atualizar usando transação
            await this.prisma.$transaction(async (prisma) => {
                // Atualizar item
                if (Object.keys(data).some(key => ['code', 'name', 'description', 'price', 'active'].includes(key))) {
                    await prisma.items.update({
                        where: { item_id: parseInt(id) },
                        data: {
                            ...(data.code && { code: data.code }),
                            ...(data.name && { name: data.name }),
                            ...(data.description !== undefined && { description: data.description }),
                            ...(data.price && { price: parseFloat(data.price) }),
                            ...(data.active !== undefined && { active: data.active }),
                            updated_at: new Date()
                        }
                    });
                }

                // Atualizar service_group_id se necessário
                if (data.service_group_id !== undefined) {
                    await prisma.services.update({
                        where: { item_id: parseInt(id) },
                        data: {
                            service_group_id: data.service_group_id ? parseInt(data.service_group_id) : null
                        }
                    });
                }
            });

            return this.getServiceById(id);
        } catch (error) {
            logger.error('Erro ao atualizar serviço:', {
                id,
                data,
                error: error.message
            });
            throw error;
        }
    }

    async deleteService(id) {
        try {
            // Soft delete usando transação
            const result = await this.prisma.$transaction(async (prisma) => {
                return await prisma.items.update({
                    where: { item_id: parseInt(id) },
                    data: {
                        deleted_at: new Date(),
                        active: false
                    }
                });
            });

            return result;
        } catch (error) {
            logger.error('Erro ao deletar serviço:', {
                id,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = PrismaServiceRepository;
