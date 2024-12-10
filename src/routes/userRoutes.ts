import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateJWT, requirePermission } from '../middleware/jwtMiddleware';
import { validateRequest, schemas } from '../middleware/validationMiddleware';

export const userRoutes = Router();
const userController = new UserController();

// Middleware de autenticação para todas as rotas de usuário
userRoutes.use(authenticateJWT);

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
userRoutes.post(
  '/', 
  requirePermission(['CREATE_USER', 'MANAGE_USERS']), 
  validateRequest(schemas.user), 
  (req, res) => userController.createUser(req, res)
);

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
userRoutes.get(
  '/', 
  requirePermission(['LIST_USERS', 'MANAGE_USERS']), 
  (req, res) => userController.listUsers(req, res)
);

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
userRoutes.get(
  '/:id', 
  requirePermission(['VIEW_USER', 'MANAGE_USERS']), 
  (req, res) => userController.getUserById(req, res)
);

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
userRoutes.put(
  '/:id', 
  requirePermission(['UPDATE_USER', 'MANAGE_USERS']), 
  validateRequest(schemas.userUpdate), 
  (req, res) => userController.updateUser(req, res)
);

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
userRoutes.delete(
  '/:id', 
  requirePermission(['DELETE_USER', 'MANAGE_USERS']), 
  (req, res) => userController.deleteUser(req, res)
);
