const express = require('express');
const MovementItemController = require('./movement-item.controller');
const { authMiddleware } = require('../../middlewares/auth');

const router = express.Router();
const controller = new MovementItemController();

/**
 * @swagger
 * /movement-items:
 *   get:
 *     tags:
 *       - Movement Items
 *     summary: Lista todos os itens de movimentação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo para busca
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Itens por página
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *         description: Campo para ordenação
 *     responses:
 *       200:
 *         description: Lista de itens
 */
router.get('/movement-items', authMiddleware, controller.findAll.bind(controller));

/**
 * @swagger
 * /movement-items:
 *   post:
 *     tags:
 *       - Movement Items
 *     summary: Cria um novo item de movimentação
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movement_id
 *               - item_id
 *               - quantity
 *               - unit_price
 *             properties:
 *               movement_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *                 format: float
 *               unit_price:
 *                 type: number
 *                 format: float
 *               salesperson_id:
 *                 type: integer
 *               technician_id:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item criado com sucesso
 */
router.post('/movement-items', authMiddleware, controller.create.bind(controller));

/**
 * @swagger
 * /movement-items/{id}:
 *   put:
 *     tags:
 *       - Movement Items
 *     summary: Atualiza um item de movimentação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 format: float
 *               unit_price:
 *                 type: number
 *                 format: float
 *               salesperson_id:
 *                 type: integer
 *               technician_id:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item atualizado com sucesso
 */
router.put('/movement-items/:id', authMiddleware, controller.update.bind(controller));

/**
 * @swagger
 * /movement-items/{id}:
 *   get:
 *     tags:
 *       - Movement Items
 *     summary: Busca um item de movimentação por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item encontrado
 */
router.get('/movement-items/:id', authMiddleware, controller.findById.bind(controller));

/**
 * @swagger
 * /movement-items/movement/{movementId}:
 *   get:
 *     tags:
 *       - Movement Items
 *     summary: Lista todos os itens de uma movimentação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movementId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de itens
 */
router.get('/movement-items/movement/:movementId', authMiddleware, controller.findByMovementId.bind(controller));

/**
 * @swagger
 * /movement-items/{id}:
 *   delete:
 *     tags:
 *       - Movement Items
 *     summary: Exclui um item de movimentação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Item excluído com sucesso
 */
router.delete('/movement-items/:id', authMiddleware, controller.delete.bind(controller));

module.exports = router;
