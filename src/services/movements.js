const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MovementService {
    async list(movement_type_id, filters = {}) {
        const {
            startDate,
            endDate,
            person_id,
            license_id,
            status_id,
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

        // Outros filtros
        if (person_id) where.person_id = parseInt(person_id);
        if (license_id) where.license_id = parseInt(license_id);
        if (status_id) where.movement_status_id = parseInt(status_id);

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
            orderBy: {
                movement_date: 'desc'
            },
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
            items
        } = data;

        return await prisma.movements.create({
            data: {
                movement_date: new Date(movement_date),
                person_id: parseInt(person_id),
                total_amount: parseFloat(total_amount),
                license_id: parseInt(license_id),
                movement_type_id: parseInt(movement_type_id),
                description,
                movement_items: {
                    create: items.map(item => ({
                        service_id: parseInt(item.service_id),
                        quantity: parseFloat(item.quantity),
                        unit_value: parseFloat(item.unit_value),
                        total_value: parseFloat(item.quantity) * parseFloat(item.unit_value)
                    }))
                }
            },
            include: {
                movement_items: true
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
                        service_id: parseInt(item.service_id),
                        quantity: parseFloat(item.quantity),
                        unit_value: parseFloat(item.unit_value),
                        total_value: parseFloat(item.quantity) * parseFloat(item.unit_value)
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
}

module.exports = new MovementService();
