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
            let whereConditions = ['i.deleted_at IS NULL', 'i.active = true'];
            let queryParams = [];
            let paramCount = 1;

            if (filters.searchTerm) {
                whereConditions.push(`(i.name ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`);
                queryParams.push(`%${filters.searchTerm}%`);
                paramCount++;
            }

            if (filters.service_group_id) {
                whereConditions.push(`s.service_group_id = $${paramCount}`);
                queryParams.push(parseInt(filters.service_group_id));
                paramCount++;
            }

            const countQuery = `
                SELECT COUNT(*) as total
                FROM services s
                INNER JOIN items i ON i.item_id = s.item_id
                WHERE ${whereConditions.join(' AND ')}
            `;
            
            const totalResult = await this.prisma.$queryRawUnsafe(countQuery, ...queryParams);
            const total = parseInt(totalResult[0].total);

            const query = `
                SELECT 
                    i.item_id,
                    i.code,
                    i.name,
                    i.description,
                    i.price,
                    i.created_at,
                    i.updated_at,
                    s.service_group_id,
                    i.active
                FROM services s
                INNER JOIN items i ON i.item_id = s.item_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY i.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            queryParams.push(parseInt(take), parseInt(skip));

            const result = await this.prisma.$queryRawUnsafe(query, ...queryParams);

            return {
                data: result,
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
            console.error('Erro SQL:', {
                message: error.message,
                code: error.code,
                meta: error.meta,
                filters,
                skip,
                take
            });
            throw error;
        }
    }

    async getServiceById(id) {
        try {
            const query = `
                SELECT 
                    i.item_id,
                    i.code,
                    i.name,
                    i.description,
                    i.price,
                    i.created_at,
                    i.updated_at,
                    s.service_group_id,
                    i.active
                FROM services s
                INNER JOIN items i ON i.item_id = s.item_id
                WHERE i.item_id = $1
                AND i.deleted_at IS NULL
                AND i.active = true
            `;

            const result = await this.prisma.$queryRawUnsafe(query, parseInt(id));
            return result[0] || null;
        } catch (error) {
            console.error('Erro ao buscar serviço:', {
                id,
                error: error.message
            });
            throw error;
        }
    }

    async createService(data) {
        try {
            // Primeiro, verificar se o código já existe
            const existingItem = await this.prisma.$queryRaw`
                SELECT item_id FROM items 
                WHERE code = ${data.code} 
                AND deleted_at IS NULL
            `;

            if (existingItem.length > 0) {
                throw new Error('Service code already exists');
            }

            // Inserir primeiro na tabela items
            const itemQuery = `
                INSERT INTO items (
                    code,
                    name,
                    description,
                    price,
                    active,
                    created_at,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, NOW(), NOW()
                )
                RETURNING item_id
            `;

            const itemParams = [
                data.code,
                data.name,
                data.description,
                parseFloat(data.price),
                true
            ];

            const itemResult = await this.prisma.$queryRawUnsafe(itemQuery, ...itemParams);
            const itemId = itemResult[0].item_id;

            // Inserir na tabela services
            const serviceQuery = `
                INSERT INTO services (
                    item_id,
                    service_group_id
                ) VALUES (
                    $1, $2
                )
                RETURNING service_id
            `;

            await this.prisma.$queryRawUnsafe(
                serviceQuery, 
                itemId,
                data.service_group_id ? parseInt(data.service_group_id) : null
            );

            // Retornar o serviço completo
            return this.getServiceById(itemId);
        } catch (error) {
            console.error('Erro ao criar serviço:', {
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

            // Verificar código duplicado se estiver sendo alterado
            if (data.code && data.code !== service.code) {
                const existingItem = await this.prisma.$queryRaw`
                    SELECT item_id FROM items 
                    WHERE code = ${data.code} 
                    AND item_id != ${id}
                    AND deleted_at IS NULL
                `;

                if (existingItem.length > 0) {
                    throw new Error('Service code already exists');
                }
            }

            // Atualizar items
            let updateFields = [];
            let params = [];
            let paramCount = 1;

            if (data.code !== undefined) {
                updateFields.push(`code = $${paramCount++}`);
                params.push(data.code);
            }

            if (data.name !== undefined) {
                updateFields.push(`name = $${paramCount++}`);
                params.push(data.name);
            }

            if (data.description !== undefined) {
                updateFields.push(`description = $${paramCount++}`);
                params.push(data.description);
            }

            if (data.price !== undefined) {
                updateFields.push(`price = $${paramCount++}`);
                params.push(parseFloat(data.price));
            }

            if (data.active !== undefined) {
                updateFields.push(`active = $${paramCount++}`);
                params.push(data.active);
            }

            updateFields.push(`updated_at = NOW()`);

            // Atualizar item
            if (updateFields.length > 0) {
                const itemQuery = `
                    UPDATE items 
                    SET ${updateFields.join(', ')}
                    WHERE item_id = $${paramCount}
                `;
                params.push(parseInt(id));
                await this.prisma.$queryRawUnsafe(itemQuery, ...params);
            }

            // Atualizar service_group_id se necessário
            if (data.service_group_id !== undefined) {
                const serviceQuery = `
                    UPDATE services 
                    SET service_group_id = $1
                    WHERE item_id = $2
                `;
                await this.prisma.$queryRawUnsafe(
                    serviceQuery,
                    data.service_group_id ? parseInt(data.service_group_id) : null,
                    parseInt(id)
                );
            }

            return this.getServiceById(id);
        } catch (error) {
            console.error('Erro ao atualizar serviço:', {
                id,
                data,
                error: error.message
            });
            throw error;
        }
    }

    async deleteService(id) {
        try {
            const now = new Date();
            
            // Soft delete do item
            const query = `
                UPDATE items 
                SET deleted_at = NOW(), active = false
                WHERE item_id = $1
                RETURNING item_id
            `;

            const result = await this.prisma.$queryRawUnsafe(query, parseInt(id));
            return result[0] || null;
        } catch (error) {
            console.error('Erro ao deletar serviço:', {
                id,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = PrismaServiceRepository;
