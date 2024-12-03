const express = require('express');
const router = express.Router();
const movementService = require('../services/movements');

const MOVEMENT_TYPE_SALES = 1;

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Lista todas as vendas
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por nome da pessoa
 *       - in: query
 *         name: person_id
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *       - in: query
 *         name: license_id
 *         schema:
 *           type: integer
 *         description: ID da licença
 *       - in: query
 *         name: status_id
 *         schema:
 *           type: integer
 *         description: ID do status
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Valor mínimo
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Valor máximo
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [movement_date, total_amount, created_at, updated_at]
 *           default: movement_date
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem da ordenação
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Registros por página
 *     responses:
 *       200:
 *         description: Lista de vendas paginada com filtros
 */
router.get('/', async (req, res) => {
    try {
        const filters = {
            search: req.query.search,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            person_id: req.query.person_id,
            license_id: req.query.license_id,
            status_id: req.query.status_id,
            minAmount: req.query.minAmount,
            maxAmount: req.query.maxAmount,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
            page: req.query.page,
            limit: req.query.limit
        };

        const sales = await movementService.list(MOVEMENT_TYPE_SALES, filters);
        res.json(sales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar vendas' });
    }
});

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Busca uma venda pelo ID
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venda encontrada
 *       404:
 *         description: Venda não encontrada
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await movementService.getById(id);

        if (!sale || sale.movement_type_id !== MOVEMENT_TYPE_SALES) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        res.json(sale);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar venda' });
    }
});

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Cria uma nova venda
 *     tags: [Sales]
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
 *               - items
 *     responses:
 *       201:
 *         description: Venda criada com sucesso
 */
router.post('/', async (req, res) => {
    try {
        const saleData = {
            ...req.body,
            movement_type_id: MOVEMENT_TYPE_SALES
        };

        const sale = await movementService.create(saleData);
        res.status(201).json(sale);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar venda' });
    }
});

/**
 * @swagger
 * /sales/{id}:
 *   put:
 *     summary: Atualiza uma venda
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venda atualizada com sucesso
 *       404:
 *         description: Venda não encontrada
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se é uma venda
        const existingSale = await movementService.getById(id);
        if (!existingSale || existingSale.movement_type_id !== MOVEMENT_TYPE_SALES) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        const sale = await movementService.update(id, req.body);
        res.json(sale);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar venda' });
    }
});

/**
 * @swagger
 * /sales/{id}:
 *   delete:
 *     summary: Remove uma venda
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venda removida com sucesso
 *       404:
 *         description: Venda não encontrada
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se é uma venda
        const existingSale = await movementService.getById(id);
        if (!existingSale || existingSale.movement_type_id !== MOVEMENT_TYPE_SALES) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        await movementService.delete(id);
        res.json({ message: 'Venda removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover venda' });
    }
});

/**
 * @swagger
 * /sales/{id}/cancel:
 *   post:
 *     summary: Cancela um movimento de venda
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movimento cancelado com sucesso
 *       404:
 *         description: Movimento não encontrado
 */
router.post('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('DEBUG: Rota de cancelamento chamada', { 
            id, 
            method: req.method, 
            originalUrl: req.originalUrl 
        });

        // Por enquanto, apenas retorna a mensagem
        res.json({ message: 'movimento cancelado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cancelar movimento' });
    }
});

module.exports = router;
