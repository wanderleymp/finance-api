const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const PrismaMovementRepository = require('../repositories/implementations/PrismaMovementRepository');
const PrismaMovementPaymentRepository = require('../repositories/implementations/PrismaMovementPaymentRepository');
const PrismaInstallmentRepository = require('../repositories/implementations/PrismaInstallmentRepository');

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
        if (!validSortFields.includes(sortBy)) {
            sortBy = 'movement_date';
            sortOrder = 'desc';
        }

        // Calculando paginação
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);
        const skip = (pageInt - 1) * limitInt;

        // Usando o repository para buscar os movimentos
        const movements = await this.repository.getAllMovements(
            where,
            skip,
            limitInt,
            { field: sortBy, order: sortOrder.toLowerCase() }
        );

        // Retornando os dados com paginação
        return {
            data: movements.data,
            pagination: {
                total: movements.total,
                page: pageInt,
                limit: limitInt,
                totalPages: Math.ceil(movements.total / limitInt)
            }
        };
    }

    async getById(id) {
        try {
            const movement = await prisma.movements.findUnique({
                where: { movement_id: parseInt(id) },
                include: {
                    movement_items: {
                        include: {
                            movements: true,
                            user_accounts_movement_items_salesperson_idTouser_accounts: true,
                            user_accounts_movement_items_technician_idTouser_accounts: true
                        }
                    },
                    movement_statuses: true,
                    movement_types: true,
                    persons: true
                }
            });

            if (!movement) {
                throw new Error(`Movimento com ID ${id} não encontrado`);
            }

            return movement;
        } catch (error) {
            console.error('Erro ao buscar movimento por ID:', error);
            throw error;
        }
    }

    async getByIdOriginal(id) {
        return await prisma.movements.findUnique({
            where: { movement_id: parseInt(id) }
        });
    }

    async create(data) {
        const {
            movement_date,
            person_id,
            total_amount = 0,
            license_id,
            movement_type_id,
            description,
            items,
            payment_method_id,
            movement_status_id = 23 // Alterado para movement_status_id padrão 23
        } = data;

        const createData = {
            movement_date: movement_date ? new Date(movement_date) : new Date(),
            person_id: parseInt(person_id),
            total_amount: parseFloat(total_amount),
            license_id: parseInt(license_id),
            movement_type_id: parseInt(movement_type_id),
            payment_method_id: payment_method_id ? parseInt(payment_method_id) : null,
            movement_status_id: parseInt(movement_status_id),
            description
        };

        // Se tiver items, processar e incluir no createData
        if (items && items.length > 0) {
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

            createData.movement_items = {
                create: processedItems
            };
        }

        return await prisma.movements.create({
            data: createData
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

        const updateData = {
            movement_date: movement_date ? new Date(movement_date) : undefined,
            person_id: person_id ? parseInt(person_id) : undefined,
            total_amount: total_amount ? parseFloat(total_amount) : undefined,
            license_id: license_id ? parseInt(license_id) : undefined,
            description
        };

        // Só processa os itens se eles forem fornecidos
        if (items && items.length > 0) {
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

            updateData.movement_items = {
                create: processedItems
            };
        }

        return await prisma.movements.update({
            where: { movement_id: parseInt(id) },
            data: updateData
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
        if (movement.movement_status_id === 19) {
            return { 
                message: 'Movimento já está cancelado',
                movementId: movementId,
                alreadyCancelled: true
            };
        }

        const previousStatusId = movement.movement_status_id;

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

    async createMovementPayment(data) {
        try {
            const movementPaymentRepository = new PrismaMovementPaymentRepository();

            // Validar campos obrigatórios
            if (!data.movement_id || !data.payment_method_id || !data.total_amount) {
                throw new Error('Campos obrigatórios para criação de pagamento: movement_id, payment_method_id, total_amount');
            }

            // Criar pagamento de movimento com parcelas
            const result = await movementPaymentRepository.createMovementPaymentWithInstallments({
                movement_id: data.movement_id,
                payment_method_id: data.payment_method_id,
                total_amount: data.total_amount,
                movement_date: new Date()
            });

            return result;
        } catch (error) {
            console.error('Erro ao criar pagamento de movimento:', error);
            throw error;
        }
    }

    async createSaleWithItems(saleData) {
        try {
            // Iniciar transação com timeout maior
            return await prisma.$transaction(async (tx) => {
                // 1. Criar o movimento base (sem items)
                const movement = await this.create({
                    movement_type_id: 1, // Venda
                    movement_status_id: saleData.movement_status_id,
                    description: saleData.description,
                    person_id: saleData.person_id,
                    license_id: saleData.license_id,
                    discount: saleData.discount || 0,
                    addition: saleData.addition || 0,
                    total_amount: 0 // Será recalculado após adicionar os items
                });

                // 2. Se houver items, adicionar cada um
                if (saleData.items && saleData.items.length > 0) {
                    await this.addItems(movement.movement_id, saleData.items.map(item => ({
                        item_id: item.item_id,
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || movement.total_amount,
                        salesperson_id: saleData.seller_id,
                        technician_id: saleData.technician_id
                    })));
                }

                // 3. Buscar o movimento atualizado com o total recalculado
                const updatedMovement = await this.getById(movement.movement_id);

                // 4. Se tiver forma de pagamento, criar o pagamento
                if (saleData.payment_method_id) {
                    await this.createMovementPayment({
                        movement_id: movement.movement_id,
                        payment_method_id: saleData.payment_method_id,
                        total_amount: updatedMovement.total_amount
                    });
                }

                // 5. Retornar o movimento final
                return this.getById(movement.movement_id);
            }, {
                timeout: 30000 // 30 segundos
            });
        } catch (error) {
            console.error('Erro ao criar venda completa:', error);
            throw error;
        }
    }
}

module.exports = new MovementService();
