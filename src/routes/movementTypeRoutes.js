const express = require('express');
const router = express.Router();
const movementTypeController = require('../controllers/movementTypeController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /movement-types:
 *   get:
 *     summary: Lista todos os tipos de movimento
 *     tags: [Movement Types]
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
 *         description: Quantidade de registros por página
 *     responses:
 *       200:
 *         description: Lista de tipos de movimento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       movement_type_id:
 *                         type: integer
 *                       type_name:
 *                         type: string
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
router.get('/', (req, res) => movementTypeController.getAllMovementTypes(req, res));

/**
 * @swagger
 * /movement-types/{id}:
 *   get:
 *     summary: Obtém um tipo de movimento pelo ID
 *     tags: [Movement Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do tipo de movimento
 *     responses:
 *       200:
 *         description: Tipo de movimento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movement_type_id:
 *                   type: integer
 *                 type_name:
 *                   type: string
 *       404:
 *         description: Tipo de movimento não encontrado
 */
router.get('/:id', (req, res) => movementTypeController.getMovementTypeById(req, res));

/**
 * @swagger
 * /movement-types:
 *   post:
 *     summary: Cria um novo tipo de movimento
 *     tags: [Movement Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type_name
 *             properties:
 *               type_name:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Tipo de movimento criado
 *       400:
 *         description: Dados inválidos ou tipo de movimento já existe
 */
router.post('/', (req, res) => movementTypeController.createMovementType(req, res));

/**
 * @swagger
 * /movement-types/{id}:
 *   put:
 *     summary: Atualiza um tipo de movimento
 *     tags: [Movement Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do tipo de movimento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type_name
 *             properties:
 *               type_name:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Tipo de movimento atualizado
 *       400:
 *         description: Dados inválidos ou tipo de movimento já existe
 *       404:
 *         description: Tipo de movimento não encontrado
 */
router.put('/:id', (req, res) => movementTypeController.updateMovementType(req, res));

/**
 * @swagger
 * /movement-types/{id}:
 *   delete:
 *     summary: Remove um tipo de movimento
 *     tags: [Movement Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do tipo de movimento
 *     responses:
 *       204:
 *         description: Tipo de movimento removido
 *       400:
 *         description: Não é possível remover tipo de movimento com relacionamentos
 *       404:
 *         description: Tipo de movimento não encontrado
 */
router.delete('/:id', (req, res) => movementTypeController.deleteMovementType(req, res));

module.exports = router;
