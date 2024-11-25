const express = require('express');
const router = express.Router();
const LogsController = require('../controllers/logsController');

const controller = new LogsController();

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Retorna os logs do sistema
 *     description: Recupera os logs do sistema, podendo filtrar por tipo e número de linhas
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [combined, error]
 *         description: Tipo de log para retornar (combined ou error)
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *         description: Número de linhas para retornar
 *     responses:
 *       200:
 *         description: Logs recuperados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   description: Tipo de log retornado
 *                 lines:
 *                   type: integer
 *                   description: Número de linhas retornadas
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Erro ao recuperar logs
 */
router.get('/', controller.getLogs.bind(controller));

module.exports = router;
