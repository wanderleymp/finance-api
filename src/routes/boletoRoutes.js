const express = require('express');
const router = express.Router();
const boletoController = require('../controllers/boletoController');
const authenticateToken = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /boletos:
 *   post:
 *     summary: Criar um novo boleto
 *     tags: [Boletos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Boleto criado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authenticateToken, boletoController.createBoleto);

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

module.exports = router;
