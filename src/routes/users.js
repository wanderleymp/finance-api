const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/usersController');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do usuário
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação do usuário
 *       example:
 *         id: 1
 *         name: "João Silva"
 *         email: "joao.silva@example.com"
 *         created_at: "2023-01-01T00:00:00.000Z"
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retorna todos os usuários
 *     description: Recupera uma lista de todos os usuários cadastrados no sistema
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuários recuperada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/', getAllUsers);

module.exports = router;
