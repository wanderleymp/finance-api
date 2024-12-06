const express = require('express');
const router = express.Router();
const MovementPaymentController = require('../controllers/MovementPaymentController');
const PrismaMovementPaymentRepository = require('../repositories/implementations/PrismaMovementPaymentRepository');
const authenticateToken = require('../middlewares/authMiddleware');

const movementPaymentRepository = new PrismaMovementPaymentRepository();
const movementPaymentController = new MovementPaymentController(movementPaymentRepository);

/**
 * @swagger
 * /movement-payments:
 *   get:
 *     tags: [Movement Payments]
 *     summary: Get all movement payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all movement payments
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, (req, res) => movementPaymentController.getAllMovementPayments(req, res));

/**
 * @swagger
 * /movement-payments/{id}:
 *   get:
 *     tags: [Movement Payments]
 *     summary: Get movement payment by ID
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
 *         description: Movement payment details
 *       404:
 *         description: Movement payment not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, (req, res) => movementPaymentController.getMovementPaymentById(req, res));

/**
 * @swagger
 * /movement-payments:
 *   post:
 *     tags: [Movement Payments]
 *     summary: Create a new movement payment
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
 *               - amount
 *             properties:
 *               movement_id:
 *                 type: integer
 *               installment_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Movement payment created
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Movement or Installment not found
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, (req, res) => movementPaymentController.createMovementPayment(req, res));

/**
 * @swagger
 * /movement-payments/{id}:
 *   put:
 *     tags: [Movement Payments]
 *     summary: Update a movement payment
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
 *               movement_id:
 *                 type: integer
 *               installment_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Movement payment updated
 *       404:
 *         description: Movement payment, Movement, or Installment not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, (req, res) => movementPaymentController.updateMovementPayment(req, res));

/**
 * @swagger
 * /movement-payments/{id}:
 *   delete:
 *     tags: [Movement Payments]
 *     summary: Delete a movement payment
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
 *         description: Movement payment deleted
 *       404:
 *         description: Movement payment not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, (req, res) => movementPaymentController.deleteMovementPayment(req, res));

/**
 * @swagger
 * /movement-payments/movement/{movementId}:
 *   get:
 *     tags: [Movement Payments]
 *     summary: Get movement payments by movement ID
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
 *         description: List of movement payments for the movement
 *       500:
 *         description: Server error
 */
router.get('/movement/:movementId', authenticateToken, (req, res) => movementPaymentController.getMovementPaymentsByMovementId(req, res));

/**
 * @swagger
 * /movement-payments/installment/{installmentId}:
 *   get:
 *     tags: [Movement Payments]
 *     summary: Get movement payments by installment ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: installmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of movement payments for the installment
 *       500:
 *         description: Server error
 */
router.get('/installment/:installmentId', authenticateToken, (req, res) => movementPaymentController.getMovementPaymentsByInstallmentId(req, res));

module.exports = router;
