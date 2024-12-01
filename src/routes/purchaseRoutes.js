const express = require('express');
const router = express.Router();
const PurchaseController = require('../controllers/PurchaseController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /purchases:
 *   post:
 *     summary: Criar uma nova compra
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               movement_date:
 *                 type: string
 *                 format: date
 *               person_id:
 *                 type: integer
 *               total_amount:
 *                 type: number
 *               license_id:
 *                 type: integer
 *               discount:
 *                 type: number
 *               addition:
 *                 type: number
 *               total_items:
 *                 type: number
 *               payment_method_id:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Compra criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', (req, res) => PurchaseController.createPurchase(req, res));

/**
 * @swagger
 * /purchases/{id}:
 *   get:
 *     summary: Buscar uma compra pelo ID
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     responses:
 *       200:
 *         description: Compra encontrada
 *       404:
 *         description: Compra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', (req, res) => PurchaseController.getPurchaseById(req, res));

/**
 * @swagger
 * /purchases:
 *   get:
 *     summary: Listar todas as compras
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Lista de compras
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', (req, res) => PurchaseController.getAllPurchases(req, res));

/**
 * @swagger
 * /purchases/{id}:
 *   put:
 *     summary: Atualizar uma compra
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movement_date:
 *                 type: string
 *                 format: date
 *               total_amount:
 *                 type: number
 *               discount:
 *                 type: number
 *               addition:
 *                 type: number
 *               total_items:
 *                 type: number
 *               payment_method_id:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Compra atualizada
 *       404:
 *         description: Compra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', (req, res) => PurchaseController.updatePurchase(req, res));

/**
 * @swagger
 * /purchases/{id}:
 *   delete:
 *     summary: Excluir uma compra
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     responses:
 *       204:
 *         description: Compra excluída
 *       404:
 *         description: Compra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', (req, res) => PurchaseController.deletePurchase(req, res));

module.exports = router;
