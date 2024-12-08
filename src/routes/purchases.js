const express = require('express');
const router = express.Router();
const movementService = require('../services/movements');
const authenticateToken = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

const MOVEMENT_TYPE_PURCHASES = 2;

/**
 * @swagger
 * /purchases:
 *   get:
 *     summary: Lista todas as compras
 *     tags: [Purchases]
 *     responses:
 *       200:
 *         description: Lista de compras
 */
router.get('/purchases', async (req, res) => {
    try {
        const purchases = await movementService.list(MOVEMENT_TYPE_PURCHASES);
        res.json(purchases);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar compras' });
    }
});

/**
 * @swagger
 * /purchases/{id}:
 *   get:
 *     summary: Busca uma compra pelo ID
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compra encontrada
 *       404:
 *         description: Compra não encontrada
 */
router.get('/purchases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await movementService.getById(id);

        if (!purchase || purchase.movement_type_id !== MOVEMENT_TYPE_PURCHASES) {
            return res.status(404).json({ error: 'Compra não encontrada' });
        }

        res.json(purchase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar compra' });
    }
});

/**
 * @swagger
 * /purchases:
 *   post:
 *     summary: Cria uma nova compra
 *     tags: [Purchases]
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
 *         description: Compra criada com sucesso
 */
router.post('/purchases', async (req, res) => {
    try {
        const purchaseData = {
            ...req.body,
            movement_type_id: MOVEMENT_TYPE_PURCHASES
        };

        const purchase = await movementService.create(purchaseData);
        res.status(201).json(purchase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar compra' });
    }
});

/**
 * @swagger
 * /purchases/{id}:
 *   put:
 *     summary: Atualiza uma compra
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compra atualizada com sucesso
 *       404:
 *         description: Compra não encontrada
 */
router.put('/purchases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se é uma compra
        const existingPurchase = await movementService.getById(id);
        if (!existingPurchase || existingPurchase.movement_type_id !== MOVEMENT_TYPE_PURCHASES) {
            return res.status(404).json({ error: 'Compra não encontrada' });
        }

        const purchase = await movementService.update(id, req.body);
        res.json(purchase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar compra' });
    }
});

/**
 * @swagger
 * /purchases/{id}:
 *   delete:
 *     summary: Remove uma compra
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compra removida com sucesso
 *       404:
 *         description: Compra não encontrada
 */
router.delete('/purchases/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se é uma compra
        const existingPurchase = await movementService.getById(id);
        if (!existingPurchase || existingPurchase.movement_type_id !== MOVEMENT_TYPE_PURCHASES) {
            return res.status(404).json({ error: 'Compra não encontrada' });
        }

        await movementService.delete(id);
        res.json({ message: 'Compra removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover compra' });
    }
});

module.exports = router;
