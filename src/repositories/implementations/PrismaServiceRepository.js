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
            // Construindo a cláusula WHERE dinamicamente
            let whereConditions = ['s.deleted_at IS NULL', 's.active = true'];
            let queryParams = [];
            let paramCount = 1;

            // Busca por termo em nome ou descrição
            if (filters.searchTerm) {
                whereConditions.push(`(s.name ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`);
                queryParams.push(`%${filters.searchTerm}%`);
                paramCount++;
            }

            if (filters.status) {
                whereConditions.push(`s.status = $${paramCount}`);
                queryParams.push(filters.status);
                paramCount++;
            }

            if (filters.service_group_id) {
                whereConditions.push(`s.service_group_id = $${paramCount}`);
                queryParams.push(parseInt(filters.service_group_id));
                paramCount++;
            }

            // Log dos filtros recebidos
            console.log('Filtros recebidos:', {
                filters,
                whereConditions,
                queryParams
            });

            // Query para contar o total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM services s
                WHERE ${whereConditions.join(' AND ')}
            `;
            
            const totalResult = await this.prisma.$queryRawUnsafe(countQuery, ...queryParams);
            const total = parseInt(totalResult[0].total);

            // Query principal com paginação
            const query = `
                SELECT 
                    s.item_id,
                    s.code,
                    s.name,
                    s.description,
                    s.status,
                    s.price,
                    s.created_at,
                    s.updated_at,
                    s.service_group_id,
                    s.active
                FROM services s
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY s.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Adiciona parâmetros de paginação
            queryParams.push(parseInt(take), parseInt(skip));

            console.log('Query executada:', {
                query,
                params: queryParams,
                resultCount: 0,
                whereClause: whereConditions.join(' AND ')
            });

            const result = await this.prisma.$queryRawUnsafe(query, ...queryParams);

            // Calcula metadados da paginação
            const totalPages = Math.ceil(total / take);
            const currentPage = Math.floor(skip / take) + 1;

            return {
                data: result,
                pagination: {
                    total,
                    currentPage,
                    totalPages,
                    hasNext: currentPage < totalPages,
                    hasPrevious: currentPage > 1,
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
                    s.item_id,
                    s.code,
                    s.name,
                    s.description,
                    s.status,
                    s.price,
                    s.created_at,
                    s.updated_at,
                    s.service_group_id,
                    s.active
                FROM services s
                WHERE s.item_id = $1
                AND s.deleted_at IS NULL
                AND s.active = true
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
            // Verificar se código já existe
            const existingService = await this.prisma.$queryRaw`
                SELECT item_id FROM services 
                WHERE code = ${data.code} 
                AND deleted_at IS NULL
            `;

            if (existingService.length > 0) {
                throw new Error('Service code already exists');
            }

            const query = `
                INSERT INTO services (
                    code,
                    name,
                    description,
                    status,
                    price,
                    service_group_id,
                    active,
                    created_at,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
                )
                RETURNING 
                    item_id,
                    code,
                    name,
                    description,
                    status,
                    price,
                    service_group_id,
                    active,
                    created_at,
                    updated_at
            `;

            const params = [
                data.code,
                data.name,
                data.description,
                data.status || 'active',
                parseFloat(data.price),
                data.service_group_id ? parseInt(data.service_group_id) : null,
                true
            ];

            const result = await this.prisma.$queryRawUnsafe(query, ...params);
            return result[0];
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
            // Verificar se serviço existe
            const service = await this.getServiceById(parseInt(id));
            if (!service) {
                throw new Error('Service not found');
            }

            // Verificar se o novo código já existe (se estiver sendo alterado)
            if (data.code && data.code !== service.code) {
                const existingService = await this.prisma.$queryRaw`
                    SELECT item_id FROM services 
                    WHERE code = ${data.code} 
                    AND deleted_at IS NULL 
                    AND item_id != ${parseInt(id)}
                `;

                if (existingService.length > 0) {
                    throw new Error('Service code already exists');
                }
            }

            const updateFields = [];
            const params = [];
            let paramCount = 1;

            // Construir query dinâmica apenas com campos que estão sendo atualizados
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
            if (data.status !== undefined) {
                updateFields.push(`status = $${paramCount++}`);
                params.push(data.status);
            }
            if (data.price !== undefined) {
                updateFields.push(`price = $${paramCount++}`);
                params.push(parseFloat(data.price));
            }
            if (data.service_group_id !== undefined) {
                updateFields.push(`service_group_id = $${paramCount++}`);
                params.push(data.service_group_id ? parseInt(data.service_group_id) : null);
            }

            updateFields.push(`updated_at = NOW()`);

            // Adicionar ID como último parâmetro
            params.push(parseInt(id));

            const query = `
                UPDATE services 
                SET ${updateFields.join(', ')}
                WHERE item_id = $${paramCount}
                AND deleted_at IS NULL
                RETURNING 
                    item_id,
                    code,
                    name,
                    description,
                    status,
                    price,
                    service_group_id,
                    active,
                    created_at,
                    updated_at
            `;

            const result = await this.prisma.$queryRawUnsafe(query, ...params);
            return result[0];
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
            const query = `
                UPDATE services 
                SET 
                    deleted_at = NOW(),
                    active = false
                WHERE item_id = $1
                AND deleted_at IS NULL
                RETURNING item_id
            `;

            const result = await this.prisma.$queryRawUnsafe(query, parseInt(id));
            return result[0] ? true : false;
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
