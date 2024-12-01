const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/movements:
 *   get:
 *     summary: Lista todos os movimentos
 *     tags: [Movements]
 *     parameters:
 *       - in: query
 *         name: movement_type_id
 *         schema:
 *           type: integer
 *         description: ID do tipo de movimento (1 para vendas, 2 para compras)
 *     responses:
 *       200:
 *         description: Lista de movimentos
 */
router.get('/', async (req, res) => {
    try {
        const { movement_type_id } = req.query;
        const movements = await prisma.movements.findMany({
            where: {
                movement_type_id: movement_type_id ? parseInt(movement_type_id) : undefined,
                is_template: false
            },
            include: {
                persons: true,
                licenses: true,
                movement_statuses: true,
                movement_items: {
                    include: {
                        services: true
                    }
                }
            }
        });
        res.json(movements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar movimentos' });
    }
});

/**
 * @swagger
 * /api/movements/{id}:
 *   get:
 *     summary: Busca um movimento pelo ID
 *     tags: [Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movimento encontrado
 *       404:
 *         description: Movimento não encontrado
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const movement = await prisma.movements.findUnique({
            where: { movement_id: parseInt(id) },
            include: {
                persons: true,
                licenses: true,
                movement_statuses: true,
                movement_items: {
                    include: {
                        services: true
                    }
                }
            }
        });

        if (!movement) {
            return res.status(404).json({ error: 'Movimento não encontrado' });
        }

        res.json(movement);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar movimento' });
    }
});

/**
 * @swagger
 * /api/movements:
 *   post:
 *     summary: Cria um novo movimento
 *     tags: [Movements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movement_date
 *               - person_id
 *               - total_amount
 *               - license_id
 *               - movement_type_id
 *               - items
 *     responses:
 *       201:
 *         description: Movimento criado com sucesso
 */
router.post('/', async (req, res) => {
    try {
        const {
            movement_date,
            person_id,
            total_amount,
            license_id,
            movement_type_id,
            description,
            items
        } = req.body;

        const movement = await prisma.movements.create({
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

        res.status(201).json(movement);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar movimento' });
    }
});

/**
 * @swagger
 * /api/movements/{id}:
 *   put:
 *     summary: Atualiza um movimento
 *     tags: [Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movimento atualizado com sucesso
 *       404:
 *         description: Movimento não encontrado
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            movement_date,
            person_id,
            total_amount,
            license_id,
            description,
            items
        } = req.body;

        // Primeiro, excluir os itens existentes
        await prisma.movement_items.deleteMany({
            where: { movement_id: parseInt(id) }
        });

        // Atualizar o movimento e criar novos itens
        const movement = await prisma.movements.update({
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

        res.json(movement);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar movimento' });
    }
});

/**
 * @swagger
 * /api/movements/{id}:
 *   delete:
 *     summary: Remove um movimento
 *     tags: [Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movimento removido com sucesso
 *       404:
 *         description: Movimento não encontrado
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Primeiro, excluir os itens do movimento
        await prisma.movement_items.deleteMany({
            where: { movement_id: parseInt(id) }
        });

        // Depois, excluir o movimento
        await prisma.movements.delete({
            where: { movement_id: parseInt(id) }
        });

        res.json({ message: 'Movimento removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover movimento' });
    }
});

module.exports = router;
