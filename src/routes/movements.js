const express = require('express');
const router = express.Router();
const MovementController = require('../controllers/MovementController');
const PrismaMovementRepository = require('../repositories/implementations/PrismaMovementRepository');
const validateMovement = require('../middlewares/validateMovement');
const authenticateToken = require('../middlewares/authMiddleware');

const movementRepository = new PrismaMovementRepository();
const movementController = new MovementController(movementRepository);

/**
 * @swagger
 * components:
 *   schemas:
 *     Movement:
 *       type: object
 *       required:
 *         - movement_date
 *         - person_id
 *         - total_amount
 *         - items
 *       properties:
 *         movement_date:
 *           type: string
 *           format: date-time
 *           description: Data do movimento
 *         person_id:
 *           type: integer
 *           description: ID da pessoa relacionada
 *         total_amount:
 *           type: number
 *           format: float
 *           description: Valor total do movimento
 *         description:
 *           type: string
 *           description: Descrição do movimento
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *               - unit_value
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *               unit_value:
 *                 type: number
 */

/**
 * @swagger
 * /api/movements:
 *   get:
 *     summary: Lista todos os movimentos
 *     tags: [Movements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: sort_field
 *         schema:
 *           type: string
 *         description: Campo para ordenação
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordem da ordenação
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Lista de movimentos paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movement'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrevious:
 *                       type: boolean
 */
router.get('/', authenticateToken, (req, res) => movementController.getAllMovements(req, res));

/**
 * @swagger
 * /api/movements/{id}:
 *   get:
 *     summary: Busca um movimento pelo ID
 *     tags: [Movements]
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
 *         description: Movimento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movement'
 *       404:
 *         description: Movimento não encontrado
 */
router.get('/:id', authenticateToken, (req, res) => movementController.getMovementById(req, res));

/**
 * @swagger
 * /api/movements/{id}/history:
 *   get:
 *     summary: Busca o histórico de um movimento
 *     tags: [Movements]
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
 *         description: Histórico do movimento
 */
router.get('/:id/history', authenticateToken, (req, res) => movementController.getMovementHistory(req, res));

/**
 * @swagger
 * /api/movements:
 *   post:
 *     summary: Cria um novo movimento
 *     tags: [Movements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Movement'
 *     responses:
 *       201:
 *         description: Movimento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movement'
 */
router.post('/', [authenticateToken, validateMovement], (req, res) => movementController.createMovement(req, res));

/**
 * @swagger
 * /api/movements/{id}:
 *   put:
 *     summary: Atualiza um movimento
 *     tags: [Movements]
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
 *             $ref: '#/components/schemas/Movement'
 *     responses:
 *       200:
 *         description: Movimento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movement'
 *       404:
 *         description: Movimento não encontrado
 */
router.put('/:id', [authenticateToken, validateMovement], (req, res) => movementController.updateMovement(req, res));

/**
 * @swagger
 * /api/movements/{id}:
 *   delete:
 *     summary: Remove um movimento (soft delete)
 *     tags: [Movements]
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
 *         description: Movimento removido com sucesso
 *       404:
 *         description: Movimento não encontrado
 */
router.delete('/:id', authenticateToken, (req, res) => movementController.deleteMovement(req, res));

module.exports = router;
