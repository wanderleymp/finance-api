const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/usersController');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retorna a lista de usuários
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID do usuário
 *                     example: 1
 *                   name:
 *                     type: string
 *                     description: Nome do usuário
 *                     example: "João Silva"
 *                   email:
 *                     type: string
 *                     description: Email do usuário
 *                     example: "joao@email.com"
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', getAllUsers);

module.exports = router;
