const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/ServiceController');
const authenticateToken = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /services:
 *   get:
 *     tags: [Services]
 *     summary: Lista todos os serviços
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
 *         description: Itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por nome ou código
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtro por status (active/inactive)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Preço mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Preço máximo
 *       - in: query
 *         name: serviceGroupId
 *         schema:
 *           type: integer
 *         description: ID do grupo de serviço
 *     responses:
 *       200:
 *         description: Lista de serviços
 */
router.get('/', authenticateToken, (req, res) => ServiceController.getAllServices(req, res));

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Busca um serviço pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Serviço encontrado
 *       404:
 *         description: Serviço não encontrado
 */
router.get('/:id', authenticateToken, (req, res) => ServiceController.getServiceById(req, res));

/**
 * @swagger
 * /services:
 *   post:
 *     tags: [Services]
 *     summary: Cria um novo serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - price
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               service_group_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Serviço criado
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, (req, res) => ServiceController.createService(req, res));

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     tags: [Services]
 *     summary: Atualiza um serviço
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
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *               service_group_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Serviço atualizado
 *       404:
 *         description: Serviço não encontrado
 */
router.put('/:id', authenticateToken, (req, res) => ServiceController.updateService(req, res));

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     tags: [Services]
 *     summary: Remove um serviço (soft delete)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Serviço removido
 *       404:
 *         description: Serviço não encontrado
 */
router.delete('/:id', authenticateToken, (req, res) => ServiceController.deleteService(req, res));

module.exports = router;
