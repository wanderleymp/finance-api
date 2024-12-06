const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const PrismaMovementRepository = require('../repositories/implementations/PrismaMovementRepository');

class MovementService {
    constructor() {
        this.repository = new PrismaMovementRepository();
    }

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
            movement_status_id = 23 // Alterado para movement_status_id padrão 23
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
                movement_status_id: parseInt(movement_status_id), // Atualizado para movement_status_id
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

        // Converter e validar os itens
        const processedItems = items.map(item => {
            const quantity = parseFloat(item.quantity);
            const unitPrice = parseFloat(item.unit_price);
            
            return {
                item_id: parseInt(item.item_id),
                quantity: quantity,
                unit_price: unitPrice,
                total_price: quantity * unitPrice,
                salesperson_id: item.salesperson_id ? parseInt(item.salesperson_id) : null,
                technician_id: item.technician_id ? parseInt(item.technician_id) : null
            };
        });

        return await prisma.movements.update({
            where: { movement_id: parseInt(id) },
            data: {
                movement_date: movement_date ? new Date(movement_date) : undefined,
                person_id: person_id ? parseInt(person_id) : undefined,
                total_amount: total_amount ? parseFloat(total_amount) : undefined,
                license_id: license_id ? parseInt(license_id) : undefined,
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

    async addItems(id, items) {
        try {
            // Converter e validar os itens
            const processedItems = items.map(item => {
                const quantity = parseFloat(item.quantity);
                const unitPrice = parseFloat(item.unit_price);
                
                return {
                    item_id: parseInt(item.item_id),
                    quantity: quantity,
                    unit_price: unitPrice,
                    total_price: quantity * unitPrice,
                    salesperson_id: item.salesperson_id ? parseInt(item.salesperson_id) : null,
                    technician_id: item.technician_id ? parseInt(item.technician_id) : null
                };
            });

            // Adicionar novos itens à venda existente
            await prisma.movement_items.createMany({
                data: processedItems.map(item => ({
                    ...item,
                    movement_id: parseInt(id)
                }))
            });

            // Recalcular o total do movimento
            const updatedMovement = await this.recalculateMovementTotal(id);

            return updatedMovement;
        } catch (error) {
            console.error('Erro detalhado ao adicionar itens:', {
                message: error.message,
                stack: error.stack,
                items: items,
                movementId: id
            });
            throw error;
        }
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
            return { 
                message: 'Movimento já está cancelado',
                movementId: movementId,
                alreadyCancelled: true
            };
        }

        const previousStatusId = movement.movement_statuses?.movement_status_id;

        // Atualizar o status para cancelado (19) usando o repository
        const updatedMovement = await this.repository.updateMovementStatus(movementId, 19);

        // Log do cancelamento
        console.log('Movimento cancelado:', {
            movementId: updatedMovement.movement_id,
            previousStatus: previousStatusId,
            newStatus: 19
        });

        return { 
            message: 'Cancelamento de movimento realizado com sucesso',
            movementId: updatedMovement.movement_id
        };
    }

    async recalculateMovementTotal(movementId) {
        const movementId_int = parseInt(movementId);

        // Buscar o movimento para obter informações de desconto e acréscimo
        const movement = await prisma.movements.findUnique({
            where: { movement_id: movementId_int }
        });

        // Buscar todos os itens do movimento
        const movementItems = await prisma.movement_items.findMany({
            where: { movement_id: movementId_int }
        });

        // Calcular o total dos itens
        const totalItemsValue = movementItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

        // Calcular o total final considerando desconto e acréscimo
        const discount = parseFloat(movement.discount || 0);
        const addition = parseFloat(movement.addition || 0);
        const totalAmount = totalItemsValue + addition - discount;

        console.log('Totais calculados:', {
            totalItemsValue,
            discount,
            addition,
            totalAmount
        });

        // Atualizar o movimento com o novo total
        const updatedMovement = await prisma.movements.update({
            where: { movement_id: movementId_int },
            data: {
                total_amount: totalAmount,
                total_items: totalItemsValue  // Usando total_price como total_items
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

        console.log('Movimento atualizado:', updatedMovement);

        return updatedMovement;
    }

    async deleteItem(movementId, movementItemId) {
        try {
            // Primeiro, deletar o item
            await prisma.movement_items.delete({
                where: { 
                    movement_item_id: parseInt(movementItemId),
                    movement_id: parseInt(movementId)
                }
            });

            // Recalcular o total do movimento
            const updatedMovement = await this.recalculateMovementTotal(movementId);

            return updatedMovement;
        } catch (error) {
            console.error('Erro ao deletar item do movimento', {
                message: error.message,
                stack: error.stack,
                movementId,
                movementItemId
            });
            throw error;
        }
    }

    async updateMovementDiscount(movementId, discountValue) {
        const movementId_int = parseInt(movementId);
        const discount = parseFloat(discountValue);

        // Atualizar o desconto
        const updatedMovement = await prisma.movements.update({
            where: { movement_id: movementId_int },
            data: {
                discount: discount
            }
        });

        // Recalcular o total do movimento
        return await this.recalculateMovementTotal(movementId_int);
    }
}

module.exports = new MovementService();
