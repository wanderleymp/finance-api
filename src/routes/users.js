const express = require('express');
const router = express.Router();
const { 
    getAllUsers, 
    getUserById, 
    createUser, 
    updateUser, 
    deleteUser,
    updatePassword 
} = require('../controllers/usersController');
const authenticateToken = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do usuário
 *         username:
 *           type: string
 *           description: Nome de usuário para login
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         role:
 *           type: string
 *           description: Papel do usuário (admin ou user)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação do usuário
 *       example:
 *         id: 1
 *         username: "joao.silva"
 *         name: "João Silva"
 *         email: "joao.silva@example.com"
 *         role: "user"
 *         created_at: "2023-01-01T00:00:00.000Z"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     servers:
 *       - url: https://api.agilefinance.com.br
 *         description: Servidor de produção
 *     responses:
 *       200:
 *         description: Lista de usuários recuperada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', authenticateToken, getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtém um usuário pelo ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     servers:
 *       - url: https://api.agilefinance.com.br
 *         description: Servidor de produção
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', authenticateToken, getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     servers:
 *       - url: https://api.agilefinance.com.br
 *         description: Servidor de produção
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - name
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Username já existe
 */
router.post('/', authenticateToken, createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza um usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     servers:
 *       - url: https://api.agilefinance.com.br
 *         description: Servidor de produção
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Sem permissão para atualizar
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/:id', authenticateToken, updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove um usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     servers:
 *       - url: https://api.agilefinance.com.br
 *         description: Servidor de produção
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       204:
 *         description: Usuário removido com sucesso
 *       403:
 *         description: Sem permissão para remover
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/:id', authenticateToken, deleteUser);

/**
 * @swagger
 * /users/{id}/password:
 *   patch:
 *     summary: Atualiza a senha do usuário
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     servers:
 *       - url: https://api.agilefinance.com.br
 *         description: Servidor de produção
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Senha atual
 *               newPassword:
 *                 type: string
 *                 description: Nova senha
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *       401:
 *         description: Senha atual incorreta
 *       403:
 *         description: Sem permissão para alterar senha
 *       404:
 *         description: Usuário não encontrado
 */
router.patch('/:id/password', authenticateToken, updatePassword);

module.exports = router;
