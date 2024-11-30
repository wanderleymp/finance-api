const express = require('express');
const MovementStatusController = require('../controllers/movementStatusController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();
const movementStatusController = new MovementStatusController();

/**
 * @swagger
 * components:
 *   schemas:
 *     MovementStatus:
 *       type: object
 *       required:
 *         - status_name
 *         - movement_type_id
 *         - status_category_id
 *       properties:
 *         movement_status_id:
 *           type: integer
 *           description: The auto-generated id of the movement status
 *         status_name:
 *           type: string
 *           description: The name of the movement status
 *         description:
 *           type: string
 *           description: Optional description of the movement status
 *         status_category_id:
 *           type: integer
 *           description: The ID of the status category
 *         movement_type_id:
 *           type: integer
 *           description: The ID of the movement type
 *         is_final:
 *           type: boolean
 *           description: Indicates if this is a final status
 *         display_order:
 *           type: integer
 *           description: Optional display order for UI presentation
 *         active:
 *           type: boolean
 *           description: Indicates if the status is active (default true)
 *       example:
 *         movement_status_id: 1
 *         status_name: "Em Processamento"
 *         description: "Movimento em processo de análise"
 *         status_category_id: 1
 *         movement_type_id: 1
 *         is_final: false
 *         display_order: 2
 *         active: true
 */

/**
 * @swagger
 * tags:
 *   name: Movement Statuses
 *   description: Movement status management endpoints
 */

/**
 * @swagger
 * /movement-statuses:
 *   get:
 *     summary: Get all movement statuses with pagination
 *     tags: [Movement Statuses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of records to skip
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *         description: Number of records to take
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of movement statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MovementStatus'
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
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, (req, res) => movementStatusController.listMovementStatuses(req, res));

/**
 * @swagger
 * /movement-statuses/{id}:
 *   get:
 *     summary: Get a movement status by ID
 *     tags: [Movement Statuses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movement status ID
 *     responses:
 *       200:
 *         description: Movement status found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovementStatus'
 *       404:
 *         description: Movement status not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, (req, res) => movementStatusController.getMovementStatusById(req, res));

/**
 * @swagger
 * /movement-statuses/type/{typeId}:
 *   get:
 *     summary: Get all movement statuses for a specific movement type
 *     tags: [Movement Statuses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movement type ID
 *     responses:
 *       200:
 *         description: List of movement statuses for the specified type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MovementStatus'
 *       500:
 *         description: Server error
 */
router.get('/type/:typeId', authenticateToken, (req, res) => movementStatusController.getMovementStatusesByType(req, res));

/**
 * @swagger
 * /movement-statuses:
 *   post:
 *     summary: Create a new movement status
 *     tags: [Movement Statuses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status_name
 *               - movement_type_id
 *               - status_category_id
 *             properties:
 *               status_name:
 *                 type: string
 *               description:
 *                 type: string
 *               status_category_id:
 *                 type: integer
 *               movement_type_id:
 *                 type: integer
 *               is_final:
 *                 type: boolean
 *               display_order:
 *                 type: integer
 *               active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Movement status created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovementStatus'
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: Movement status already exists
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, (req, res) => movementStatusController.createMovementStatus(req, res));

/**
 * @swagger
 * /movement-statuses/{id}:
 *   put:
 *     summary: Update a movement status
 *     tags: [Movement Statuses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movement status ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status_name:
 *                 type: string
 *               description:
 *                 type: string
 *               status_category_id:
 *                 type: integer
 *               movement_type_id:
 *                 type: integer
 *               is_final:
 *                 type: boolean
 *               display_order:
 *                 type: integer
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Movement status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovementStatus'
 *       404:
 *         description: Movement status not found
 *       409:
 *         description: Movement status with this name already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, (req, res) => movementStatusController.updateMovementStatus(req, res));

/**
 * @swagger
 * /movement-statuses/{id}:
 *   delete:
 *     summary: Delete a movement status
 *     tags: [Movement Statuses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movement status ID
 *     responses:
 *       204:
 *         description: Movement status deleted
 *       404:
 *         description: Movement status not found
 *       409:
 *         description: Cannot delete movement status with associated movements
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, (req, res) => movementStatusController.deleteMovementStatus(req, res));

module.exports = router;
