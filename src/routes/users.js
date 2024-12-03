const express = require('express');
const router = express.Router();
const logger = require('../../config/logger');
const { 
    getAllUsers, 
    createUser, 
    updateUser, 
    deleteUser,
    updatePassword,
    getUserLicenses,
    getUserAccount
} = require('../controllers/usersController');
const authenticateToken = require('../middlewares/authMiddleware');

// Middleware de logging para debug
router.use((req, res, next) => {
  console.log('=== DEBUG USERS ROUTER ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  console.log('Request Path:', req.path);
  console.log('Request Params:', req.params);
  console.log('Base URL:', req.baseUrl);
  console.log('Route:', req.route);
  console.log('=== END DEBUG ===');

  logger.info('Rota de usuário sendo processada:', {
    originalUrl: req.originalUrl,
    method: req.method,
    path: req.path,
    params: req.params,
    baseUrl: req.baseUrl,
    route: req.route,
    stack: new Error().stack
  });
  next();
});

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

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
router.get('/', getAllUsers);

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Lista usuários com paginação e filtros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtrar por nome ou email
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       profile:
 *                         type: object
 *                       person:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           full_name:
 *                             type: string
 *                           contacts:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 type:
 *                                   type: string
 *                                 value:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/list', (req, res) => {
  const { page, limit, search } = req.query;
  // Implementação da lógica de listagem com paginação e filtros
  // ...
});

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
router.post('/', createUser);

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

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Obtém um usuário pelo ID
 *     security:
 *       - bearerAuth: []
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
router.route('/:id')
  .get(getUserAccount)
  .put(updateUser)
  .delete(deleteUser);

/**
 * @swagger
 * /users/{id}/licenses:
 *   get:
 *     summary: Obtém as licenças de um usuário
 *     description: Retorna todas as licenças associadas a um usuário específico
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de licenças do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id/licenses', (req, res) => {
    console.log('=== DEBUG: Rota /users/:id/licenses ===');
    console.log('ID:', req.params.id);
    console.log('URL:', req.originalUrl);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('=== END DEBUG ===');

    logger.info('Debug rota licenses', {
        id: req.params.id,
        url: req.originalUrl,
        method: req.method,
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body
    });

    const licenses = getUserLicenses(req.params.id);
    console.log('Licenças:', licenses);
    logger.info('Licenças do usuário', { id: req.params.id, licenses });

    res.json({ message: 'Debug route /users/:id/licenses', id: req.params.id, licenses });
});

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
router.route('/:id/password')
  .patch(updatePassword);

/**
 * @swagger
 * /users/{id}/account:
 *   get:
 *     summary: Obtém os dados da conta de um usuário
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
 *         description: Dados da conta de usuário encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 active:
 *                   type: boolean
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                 profile_id:
 *                   type: integer
 *       404:
 *         description: Conta de usuário não encontrada
 */
router.get('/:id/account', getUserAccount);

module.exports = router;
