const express = require('express');
const router = express.Router();
const InstallmentController = require('../controllers/InstallmentController');
const PrismaInstallmentRepository = require('../repositories/implementations/PrismaInstallmentRepository');
const authenticateToken = require('../middlewares/authMiddleware');

const installmentRepository = new PrismaInstallmentRepository();
const installmentController = new InstallmentController(installmentRepository);

/**
 * @swagger
 * /installments:
 *   get:
 *     tags: [Installments]
 *     summary: Get all installments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all installments
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, (req, res) => installmentController.getAllInstallments(req, res));

/**
 * @swagger
 * /installments/{id}:
 *   get:
 *     tags: [Installments]
 *     summary: Get installment by ID
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
 *         description: Installment details
 *       404:
 *         description: Installment not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, (req, res) => installmentController.getInstallmentById(req, res));

/**
 * @swagger
 * /installments:
 *   post:
 *     tags: [Installments]
 *     summary: Create a new installment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_id
 *               - amount
 *               - due_date
 *               - status
 *               - installment_number
 *             properties:
 *               payment_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               due_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               installment_number:
 *                 type: integer
 *               movement_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Installment created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, (req, res) => installmentController.createInstallment(req, res));

/**
 * @swagger
 * /installments/{id}:
 *   put:
 *     tags: [Installments]
 *     summary: Update an installment
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
 *               payment_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               due_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               installment_number:
 *                 type: integer
 *               movement_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Installment updated
 *       404:
 *         description: Installment not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, (req, res) => installmentController.updateInstallment(req, res));

/**
 * @swagger
 * /installments/{id}:
 *   delete:
 *     tags: [Installments]
 *     summary: Delete an installment
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
 *         description: Installment deleted
 *       404:
 *         description: Installment not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, (req, res) => installmentController.deleteInstallment(req, res));

/**
 * @swagger
 * /installments/{id}/message:
 *   post:
 *     tags: [Installments]
 *     summary: Send message for an installment
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
 *         description: Message sent successfully
 *       404:
 *         description: Installment not found
 *       500:
 *         description: Server error
 */
router.post('/:id/message', authenticateToken, (req, res) => installmentController.sendInstallmentMessage(req, res));

/**
 * @swagger
 * /installments/{id}/boleto:
 *   post:
 *     tags: [Installments]
 *     summary: Generate boleto for an installment
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
 *         description: Boleto generated successfully
 *       404:
 *         description: Installment not found
 *       500:
 *         description: Server error
 */
router.post('/:id/boleto', authenticateToken, (req, res) => installmentController.generateInstallmentBoleto(req, res));

/**
 * @swagger
 * /installments/payment/{paymentId}:
 *   get:
 *     tags: [Installments]
 *     summary: Get installments by payment ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of installments for the payment
 *       500:
 *         description: Server error
 */
router.get('/payment/:paymentId', authenticateToken, (req, res) => installmentController.getInstallmentsByPaymentId(req, res));

/**
 * @swagger
 * /installments/movement/{movementId}:
 *   get:
 *     tags: [Installments]
 *     summary: Get installments by movement ID
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
 *         description: List of installments for the movement
 *       500:
 *         description: Server error
 */
router.get('/movement/:movementId', authenticateToken, (req, res) => installmentController.getInstallmentsByMovementId(req, res));

module.exports = router;
