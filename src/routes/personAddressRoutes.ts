import { Router } from 'express';
import { PersonAddressController } from '../controllers/personAddressController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { body, param, query } from 'express-validator';

export const personAddressRoutes = Router();
const personAddressController = new PersonAddressController();

/**
 * @swagger
 * /person-addresses:
 *   post:
 *     summary: Criar um novo endereço de pessoa
 *     tags: [PersonAddresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               person:
 *                 type: string
 *               street:
 *                 type: string
 *               number:
 *                 type: string
 *               complement:
 *                 type: string
 *               neighborhood:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               ibgeCode:
 *                 type: string
 *               type:
 *                 type: string
 *               isMain:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Endereço de pessoa criado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 */
personAddressRoutes.post(
  '/', 
  authMiddleware,
  [
    body('person').isUUID(),
    body('street').notEmpty(),
    body('neighborhood').notEmpty(),
    body('city').notEmpty(),
    body('state').notEmpty(),
    body('zipCode').notEmpty(),
  ],
  validateRequest,
  (req, res) => personAddressController.createPersonAddress(req, res)
);

/**
 * @swagger
 * /person-addresses/{id}:
 *   get:
 *     summary: Obter detalhes de um endereço de pessoa
 *     tags: [PersonAddresses]
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
 *         description: Detalhes do endereço de pessoa
 *       404:
 *         description: Endereço não encontrado
 *       401:
 *         description: Não autorizado
 */
personAddressRoutes.get(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID()
  ],
  validateRequest,
  (req, res) => personAddressController.getPersonAddressById(req, res)
);

/**
 * @swagger
 * /person-addresses:
 *   get:
 *     summary: Listar endereços de pessoas
 *     tags: [PersonAddresses]
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
 *       - in: query
 *         name: person
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de endereços de pessoas
 *       401:
 *         description: Não autorizado
 */
personAddressRoutes.get(
  '/', 
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('person').optional().isUUID(),
    query('city').optional().isString(),
    query('state').optional().isString()
  ],
  validateRequest,
  (req, res) => personAddressController.listPersonAddresses(req, res)
);

/**
 * @swagger
 * /person-addresses/{id}:
 *   put:
 *     summary: Atualizar endereço de pessoa
 *     tags: [PersonAddresses]
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
 *               street:
 *                 type: string
 *               number:
 *                 type: string
 *               complement:
 *                 type: string
 *               neighborhood:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               ibgeCode:
 *                 type: string
 *               type:
 *                 type: string
 *               isMain:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Endereço de pessoa atualizado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Endereço não encontrado
 */
personAddressRoutes.put(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID(),
    body('street').optional().notEmpty(),
    body('neighborhood').optional().notEmpty(),
    body('city').optional().notEmpty(),
    body('state').optional().notEmpty(),
    body('zipCode').optional().notEmpty(),
  ],
  validateRequest,
  (req, res) => personAddressController.updatePersonAddress(req, res)
);

/**
 * @swagger
 * /person-addresses/{id}:
 *   delete:
 *     summary: Excluir endereço de pessoa
 *     tags: [PersonAddresses]
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
 *         description: Endereço de pessoa excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Endereço não encontrado
 */
personAddressRoutes.delete(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID()
  ],
  validateRequest,
  (req, res) => personAddressController.deletePersonAddress(req, res)
);
