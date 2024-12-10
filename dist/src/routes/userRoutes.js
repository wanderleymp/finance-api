"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const jwtMiddleware_1 = require("../middleware/jwtMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
exports.userRoutes = (0, express_1.Router)();
const userController = new userController_1.UserController();
// Middleware de autenticação para todas as rotas de usuário
exports.userRoutes.use(jwtMiddleware_1.authenticateJWT);
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Criar novo usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       409:
 *         description: Usuário já existe
 */
exports.userRoutes.post('/', (0, jwtMiddleware_1.requirePermission)(['CREATE_USER', 'MANAGE_USERS']), (0, validationMiddleware_1.validateRequest)(validationMiddleware_1.schemas.user), (req, res) => userController.createUser(req, res));
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuários
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
exports.userRoutes.get('/', (0, jwtMiddleware_1.requirePermission)(['LIST_USERS', 'MANAGE_USERS']), (req, res) => userController.listUsers(req, res));
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Buscar usuário por ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do usuário
 *       404:
 *         description: Usuário não encontrado
 */
exports.userRoutes.get('/:id', (0, jwtMiddleware_1.requirePermission)(['VIEW_USER', 'MANAGE_USERS']), (req, res) => userController.getUserById(req, res));
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualizar usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
exports.userRoutes.put('/:id', (0, jwtMiddleware_1.requirePermission)(['UPDATE_USER', 'MANAGE_USERS']), (0, validationMiddleware_1.validateRequest)(validationMiddleware_1.schemas.userUpdate), (req, res) => userController.updateUser(req, res));
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Desativar usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Usuário desativado com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
exports.userRoutes.delete('/:id', (0, jwtMiddleware_1.requirePermission)(['DELETE_USER', 'MANAGE_USERS']), (req, res) => userController.deleteUser(req, res));
//# sourceMappingURL=userRoutes.js.map