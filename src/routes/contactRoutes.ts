import { Router } from 'express';
import { ContactController } from '../controllers/contactController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { body, param, query } from 'express-validator';

export const contactRoutes = Router();
const contactController = new ContactController();

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Criar um novo contato
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [PHONE, EMAIL, WHATSAPP, TELEGRAM, OTHER]
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contato criado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 */
contactRoutes.post(
  '/', 
  authMiddleware,
  [
    body('type').isIn(['PHONE', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'OTHER']),
    body('value').notEmpty(),
  ],
  validateRequest,
  (req, res) => contactController.createContact(req, res)
);

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Obter detalhes de um contato
 *     tags: [Contacts]
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
 *         description: Detalhes do contato
 *       404:
 *         description: Contato não encontrado
 *       401:
 *         description: Não autorizado
 */
contactRoutes.get(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID()
  ],
  validateRequest,
  (req, res) => contactController.getContactById(req, res)
);

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Listar contatos
 *     tags: [Contacts]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PHONE, EMAIL, WHATSAPP, TELEGRAM, OTHER]
 *     responses:
 *       200:
 *         description: Lista de contatos
 *       401:
 *         description: Não autorizado
 */
contactRoutes.get(
  '/', 
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['PHONE', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'OTHER'])
  ],
  validateRequest,
  (req, res) => contactController.listContacts(req, res)
);

/**
 * @swagger
 * /contacts/{id}:
 *   put:
 *     summary: Atualizar contato
 *     tags: [Contacts]
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
 *               type:
 *                 type: string
 *                 enum: [PHONE, EMAIL, WHATSAPP, TELEGRAM, OTHER]
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contato atualizado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Contato não encontrado
 */
contactRoutes.put(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID(),
    body('type').optional().isIn(['PHONE', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'OTHER']),
    body('value').optional().notEmpty()
  ],
  validateRequest,
  (req, res) => contactController.updateContact(req, res)
);

/**
 * @swagger
 * /contacts/{id}:
 *   delete:
 *     summary: Excluir contato
 *     tags: [Contacts]
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
 *         description: Contato excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Contato não encontrado
 */
contactRoutes.delete(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID()
  ],
  validateRequest,
  (req, res) => contactController.deleteContact(req, res)
);
