const express = require('express');
const router = express.Router();
const SaleController = require('../controllers/SaleController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Criar uma nova venda
 *     tags: [Sales]
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
 *         description: Venda criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', (req, res) => SaleController.createSale(req, res));

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Buscar uma venda pelo ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Venda encontrada
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', (req, res) => SaleController.getSaleById(req, res));

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Listar todas as vendas
 *     tags: [Sales]
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
 *         description: Lista de vendas
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', (req, res) => SaleController.getAllSales(req, res));

/**
 * @swagger
 * /sales/{id}:
 *   put:
 *     summary: Atualizar uma venda
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
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
 *         description: Venda atualizada
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', (req, res) => SaleController.updateSale(req, res));

/**
 * @swagger
 * /sales/{id}:
 *   delete:
 *     summary: Excluir uma venda
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
 *     responses:
 *       204:
 *         description: Venda excluída
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', (req, res) => SaleController.deleteSale(req, res));

module.exports = router;
