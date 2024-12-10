import { Router } from 'express';
import { PersonContactController } from '../controllers/personContactController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { body, param, query } from 'express-validator';

export const personContactRoutes = Router();
const personContactController = new PersonContactController();

/**
 * @swagger
 * /person-contacts:
 *   post:
 *     summary: Criar um novo relacionamento pessoa-contato
 *     tags: [PersonContacts]
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
 *               contactId:
 *                 type: string
 *               nickname:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Relacionamento pessoa-contato criado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 */
personContactRoutes.post(
  '/', 
  authMiddleware,
  [
    body('person').isUUID(),
    body('contactId').isUUID(),
    body('nickname').optional().isString(),
    body('isPrimary').optional().isBoolean()
  ],
  validateRequest,
  (req, res) => personContactController.createPersonContact(req, res)
);

/**
 * @swagger
 * /person-contacts/{id}:
 *   get:
 *     summary: Obter detalhes de um relacionamento pessoa-contato
 *     tags: [PersonContacts]
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
 *         description: Detalhes do relacionamento pessoa-contato
 *       404:
 *         description: Relacionamento não encontrado
 *       401:
 *         description: Não autorizado
 */
personContactRoutes.get(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID()
  ],
  validateRequest,
  (req, res) => personContactController.getPersonContactById(req, res)
);

/**
 * @swagger
 * /person-contacts:
 *   get:
 *     summary: Listar relacionamentos pessoa-contato
 *     tags: [PersonContacts]
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
 *         name: contactId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de relacionamentos pessoa-contato
 *       401:
 *         description: Não autorizado
 */
personContactRoutes.get(
  '/', 
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('person').optional().isUUID(),
    query('contactId').optional().isUUID()
  ],
  validateRequest,
  (req, res) => personContactController.findPersonContacts(req, res)
);

/**
 * @swagger
 * /person-contacts/{id}:
 *   put:
 *     summary: Atualizar relacionamento pessoa-contato
 *     tags: [PersonContacts]
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
 *               nickname:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Relacionamento pessoa-contato atualizado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Relacionamento não encontrado
 */
personContactRoutes.put(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID(),
    body('nickname').optional().isString(),
    body('isPrimary').optional().isBoolean()
  ],
  validateRequest,
  (req, res) => personContactController.updatePersonContact(req, res)
);

/**
 * @swagger
 * /person-contacts/{id}:
 *   delete:
 *     summary: Excluir relacionamento pessoa-contato
 *     tags: [PersonContacts]
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
 *         description: Relacionamento pessoa-contato excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Relacionamento não encontrado
 */
personContactRoutes.delete(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID()
  ],
  validateRequest,
  (req, res) => personContactController.deletePersonContact(req, res)
);
