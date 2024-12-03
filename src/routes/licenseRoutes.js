const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const authenticateToken = require('../middlewares/authMiddleware');

// Middleware para logging
router.use((req, res, next) => {
    console.log('=== ROTA LICENSES ===');
    console.log('Método:', req.method);
    console.log('URL:', req.url);
    console.log('Query:', req.query);
    console.log('User:', req.user);
    next();
});

/**
 * @swagger
 * components:
 *   schemas:
 *     License:
 *       type: object
 *       required:
 *         - person_id
 *         - license_name
 *         - start_date
 *       properties:
 *         license_id:
 *           type: integer
 *           description: ID único da licença
 *         person_id:
 *           type: integer
 *           description: ID da pessoa associada à licença
 *         license_name:
 *           type: string
 *           description: Nome da licença
 *         start_date:
 *           type: string
 *           format: date
 *           description: Data de início da licença
 *         end_date:
 *           type: string
 *           format: date
 *           description: Data de término da licença
 *         status:
 *           type: string
 *           description: Status da licença (Ativa, Inativa, etc)
 *         timezone:
 *           type: string
 *           description: Fuso horário da licença
 *         active:
 *           type: boolean
 *           description: Indica se a licença está ativa ou não
 */

/**
 * @swagger
 * /api/licenses:
 *   post:
 *     summary: Criar uma nova licença
 *     security:
 *       - bearerAuth: []
 *     tags: [Licenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/License'
 *     responses:
 *       201:
 *         description: Licença criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/', authenticateToken, licenseController.createLicense);

/**
 * @swagger
 * /api/licenses:
 *   get:
 *     summary: Listar todas as licenças
 *     security:
 *       - bearerAuth: []
 *     tags: [Licenses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *         description: Filtrar por status (true, false, all)
 *     responses:
 *       200:
 *         description: Lista de licenças com paginação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/License'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrevious:
 *                       type: boolean
 *       401:
 *         description: Não autorizado
 */
router.get('/', authenticateToken, licenseController.getLicenses);

/**
 * @swagger
 * /api/licenses/{id}:
 *   get:
 *     summary: Obter licença por ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Licenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados da licença
 *       404:
 *         description: Licença não encontrada
 *       401:
 *         description: Não autorizado
 */
router.get('/:id', authenticateToken, licenseController.getLicenseById);

/**
 * @swagger
 * /api/licenses/{id}:
 *   put:
 *     summary: Atualizar uma licença
 *     security:
 *       - bearerAuth: []
 *     tags: [Licenses]
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
 *             $ref: '#/components/schemas/License'
 *     responses:
 *       200:
 *         description: Licença atualizada com sucesso
 *       404:
 *         description: Licença não encontrada
 *       401:
 *         description: Não autorizado
 */
router.put('/:id', authenticateToken, licenseController.updateLicense);

/**
 * @swagger
 * /api/licenses/{id}:
 *   delete:
 *     summary: Excluir uma licença
 *     security:
 *       - bearerAuth: []
 *     tags: [Licenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Licença excluída com sucesso
 *       404:
 *         description: Licença não encontrada
 *       401:
 *         description: Não autorizado
 */
router.delete('/:id', authenticateToken, licenseController.deleteLicense);

/**
 * @swagger
 * /api/licenses/{id}/users:
 *   get:
 *     summary: Listar usuários de uma licença
 *     security:
 *       - bearerAuth: []
 *     tags: [Licenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da licença
 *     responses:
 *       200:
 *         description: Lista de usuários da licença
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
 *                       user_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *       404:
 *         description: Licença não encontrada
 *       401:
 *         description: Não autorizado
 */
router.get('/:id/users', authenticateToken, licenseController.getLicenseUsers);

module.exports = router;
