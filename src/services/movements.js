const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MovementService {
    async list(movement_type_id, filters = {}) {
        const {
            startDate,
            endDate,
            person_id,
            search,
            license_id,
            status_id,
            minAmount,
            maxAmount,
            sortBy = 'movement_date',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = filters;

        const where = {
            movement_type_id: parseInt(movement_type_id),
            is_template: false
        };

        // Filtro por período
        if (startDate || endDate) {
            where.movement_date = {};
            if (startDate) where.movement_date.gte = new Date(startDate);
            if (endDate) where.movement_date.lte = new Date(endDate);
        }

        // Filtro por valor
        if (minAmount !== undefined || maxAmount !== undefined) {
            where.total_amount = {};
            if (minAmount !== undefined) where.total_amount.gte = parseFloat(minAmount);
            if (maxAmount !== undefined) where.total_amount.lte = parseFloat(maxAmount);
        }

        // Busca por pessoa (nome ou ID)
        if (search || person_id) {
            where.persons = {};
            
            if (search) {
                where.persons.full_name = {
                    contains: search,
                    mode: 'insensitive'
                };
            }
            
            if (person_id) {
                where.persons.id = parseInt(person_id);
            }
        }

        // Outros filtros
        if (license_id) where.license_id = parseInt(license_id);
        if (status_id) where.status_id = parseInt(status_id);

        // Validando campo de ordenação
        const validSortFields = ['movement_date', 'total_amount', 'created_at', 'updated_at'];
        const orderBy = {};
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy] = sortOrder.toLowerCase();
        } else {
            orderBy.movement_date = 'desc';
        }

        // Calculando paginação
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);
        const skip = (pageInt - 1) * limitInt;

        // Buscando total de registros
        const total = await prisma.movements.count({ where });

        // Buscando registros com paginação
        const movements = await prisma.movements.findMany({
            where,
            include: {
                persons: true,
                licenses: true,
                movement_statuses: true,
                movement_items: {
                    include: {
                        movements: true,
                        user_accounts_movement_items_salesperson_idTouser_accounts: true,
                        user_accounts_movement_items_technician_idTouser_accounts: true
                    }
                }
            },
            orderBy,
            skip,
            take: limitInt
        });

        return {
            data: movements,
            pagination: {
                total,
                page: pageInt,
                limit: limitInt,
                totalPages: Math.ceil(total / limitInt)
            }
        };
    }

    async getById(id) {
        return await prisma.movements.findUnique({
            where: { movement_id: parseInt(id) },
            include: {
                persons: true,
                licenses: true,
                movement_statuses: true,
                movement_items: {
                    include: {
                        movements: true,
                        user_accounts_movement_items_salesperson_idTouser_accounts: true,
                        user_accounts_movement_items_technician_idTouser_accounts: true
                    }
                }
            }
        });
    }

    async create(data) {
        const {
            movement_date,
            person_id,
            total_amount,
            license_id,
            movement_type_id,
            description,
            items,
            payment_method_id,
            status_id = 1 // Status padrão para novo movimento
        } = data;

        // Converter e validar os itens
        const processedItems = items.map(item => {
            const quantity = parseFloat(item.quantity);
            const unitPrice = parseFloat(item.unit_price);
            
            return {
                item_id: parseInt(item.item_id),
                quantity: quantity,
                unit_price: unitPrice,
                total_price: quantity * unitPrice, // Agora usando total_price ao invés de total_value
                salesperson_id: item.salesperson_id ? parseInt(item.salesperson_id) : null,
                technician_id: item.technician_id ? parseInt(item.technician_id) : null
            };
        });

        return await prisma.movements.create({
            data: {
                movement_date: new Date(movement_date),
                person_id: parseInt(person_id),
                total_amount: parseFloat(total_amount),
                license_id: parseInt(license_id),
                movement_type_id: parseInt(movement_type_id),
                payment_method_id: payment_method_id ? parseInt(payment_method_id) : null,
                status_id: parseInt(status_id),
                description,
                movement_items: {
                    create: processedItems
                }
            },
            include: {
                persons: true,
                licenses: true,
                movement_statuses: true,
                movement_items: {
                    include: {
                        movements: true,
                        user_accounts_movement_items_salesperson_idTouser_accounts: true,
                        user_accounts_movement_items_technician_idTouser_accounts: true
                    }
                }
            }
        });
    }

    async update(id, data) {
        const {
            movement_date,
            person_id,
            total_amount,
            license_id,
            description,
            items
        } = data;

        // Primeiro, excluir os itens existentes
        await prisma.movement_items.deleteMany({
            where: { movement_id: parseInt(id) }
        });

        // Atualizar o movimento e criar novos itens
        return await prisma.movements.update({
            where: { movement_id: parseInt(id) },
            data: {
                movement_date: new Date(movement_date),
                person_id: parseInt(person_id),
                total_amount: parseFloat(total_amount),
                license_id: parseInt(license_id),
                description,
                movement_items: {
                    create: items.map(item => ({
                        item_id: parseInt(item.item_id),
                        quantity: parseFloat(item.quantity),
                        unit_price: parseFloat(item.unit_price),
                        total_price: parseFloat(item.quantity) * parseFloat(item.unit_price), // Agora usando total_price ao invés de total_value
                        salesperson_id: item.salesperson_id ? parseInt(item.salesperson_id) : null,
                        technician_id: item.technician_id ? parseInt(item.technician_id) : null
                    }))
                }
            },
            include: {
                movement_items: true
            }
        });
    }

    async delete(id) {
        // Primeiro, excluir os itens do movimento
        await prisma.movement_items.deleteMany({
            where: { movement_id: parseInt(id) }
        });

        // Depois, excluir o movimento
        return await prisma.movements.delete({
            where: { movement_id: parseInt(id) }
        });
    }

    async cancelMovement(id) {
        // Converter id para inteiro
        const movementId = parseInt(id);

        // Verificar se o movimento existe
        const movement = await prisma.movements.findUnique({
            where: { movement_id: movementId },
            include: {
                movement_statuses: true
            }
        });

        // Verificar se o movimento não existe
        if (!movement) {
            throw new Error('Movimento não encontrado');
        }

        // Verificar se o status é diferente de 19 (cancelado)
        if (movement.movement_statuses?.movement_status_id === 19) {
            throw new Error('Movimento já está cancelado');
        }

        // Atualizar o status para cancelado (19)
        const updatedMovement = await prisma.movements.update({
            where: { movement_id: movementId },
            data: { 
                movement_statuses: {
                    connect: { movement_status_id: 19 }
                }
            },
            include: {
                movement_statuses: true
            }
        });

        // Log do cancelamento
        console.log('Movimento cancelado:', {
            movementId: updatedMovement.movement_id,
            previousStatus: movement.movement_statuses?.movement_status_id,
            newStatus: 19
        });

        return { 
            message: 'Cancelamento de movimento realizado com sucesso',
            movementId: updatedMovement.movement_id
        };
    }
}

module.exports = new MovementService();
