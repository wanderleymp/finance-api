const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const authenticateToken = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /messaging/invoice:
 *   post:
 *     summary: Enviar mensagem de faturamento
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movement_id:
 *                 type: integer
 *                 description: ID do movimento de faturamento
 *     responses:
 *       200:
 *         description: Mensagem de faturamento enviada com sucesso
 *       400:
 *         description: ID do movimento não fornecido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/invoice', authenticateToken, messagingController.sendInvoiceMessage);

/**
 * @swagger
 * /messaging/installment:
 *   post:
 *     summary: Enviar mensagem de parcela
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               installment_id:
 *                 type: integer
 *                 description: ID da parcela
 *     responses:
 *       200:
 *         description: Mensagem de parcela enviada com sucesso
 *       400:
 *         description: ID da parcela não fornecido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/installment', authenticateToken, messagingController.sendInstallmentMessage);

module.exports = router;
