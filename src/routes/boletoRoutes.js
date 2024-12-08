const express = require('express');
const router = express.Router();
const boletoController = require('../controllers/boletoController');
const authenticateToken = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /boletos/generate/{movement_id}:
 *   post:
 *     summary: Gerar boleto para um movimento específico
 *     tags: [Boletos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movement_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do movimento para gerar o boleto
 *     responses:
 *       200:
 *         description: Solicitação de geração de boleto enviada com sucesso
 *       400:
 *         description: Movimento não encontrado ou sem parcelas
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/generate/:movement_id', authenticateToken, (req, res) => {
    const movement_id = req.params.movement_id;
    boletoController.generateBoletoWebhook(req, res, { movement_id });
});

/**
 * @swagger
 * /boletos:
 *   post:
 *     summary: Gerar boleto via webhook
 *     tags: [Boletos]
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
 *                 description: ID do movimento
 *               installment_id:
 *                 type: integer
 *                 description: ID da parcela
 *     responses:
 *       200:
 *         description: Solicitação de geração de boleto enviada com sucesso
 *       400:
 *         description: Boleto já existe ou parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authenticateToken, boletoController.generateBoletoWebhook);

/**
 * @swagger
 * /boletos:
 *   get:
 *     summary: Listar boletos
 *     tags: [Boletos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de boletos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', authenticateToken, boletoController.getAllBoletos);

/**
 * @swagger
 * /boletos/{id}:
 *   get:
 *     summary: Obter boleto por ID
 *     tags: [Boletos]
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
 *         description: Detalhes do boleto
 *       404:
 *         description: Boleto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', authenticateToken, boletoController.getBoletoById);

/**
 * @swagger
 * /boletos/{id}:
 *   put:
 *     summary: Atualizar boleto
 *     tags: [Boletos]
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
 *     responses:
 *       200:
 *         description: Boleto atualizado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', authenticateToken, boletoController.updateBoleto);

/**
 * @swagger
 * /boletos/{id}:
 *   delete:
 *     summary: Excluir boleto
 *     tags: [Boletos]
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
 *         description: Boleto excluído com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', authenticateToken, boletoController.deleteBoleto);

/**
 * @swagger
 * /boletos/cancel:
 *   post:
 *     summary: Cancelar boleto
 *     tags: [Boletos]
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
 *         description: Boleto cancelado com sucesso
 *       400:
 *         description: installment_id é obrigatório
 *       404:
 *         description: Boleto não encontrado ou já cancelado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/cancel', authenticateToken, boletoController.cancelBoleto);

module.exports = router;
