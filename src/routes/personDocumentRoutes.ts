import { Router } from 'express';
import { PersonDocumentController } from '../controllers/personDocumentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { body, param, query } from 'express-validator';

export const personDocumentRoutes = Router();
const personDocumentController = new PersonDocumentController();

/**
 * @swagger
 * /person-documents:
 *   post:
 *     summary: Criar um novo documento de pessoa
 *     tags: [PersonDocuments]
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
 *               type:
 *                 type: string
 *                 enum: [CPF, CNPJ, PASSPORT, RG, OTHER]
 *               number:
 *                 type: string
 *               issueDate:
 *                 type: string
 *                 format: date
 *               expirationDate:
 *                 type: string
 *                 format: date
 *               issuer:
 *                 type: string
 *     responses:
 *       201:
 *         description: Documento de pessoa criado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 */
personDocumentRoutes.post(
  '/', 
  authMiddleware,
  [
    body('person').isUUID(),
    body('type').isIn(['CPF', 'CNPJ', 'PASSPORT', 'RG', 'OTHER']),
    body('number').notEmpty(),
    body('issueDate').optional().isISO8601(),
    body('expirationDate').optional().isISO8601(),
  ],
  validateRequest,
  (req, res) => personDocumentController.createPersonDocument(req, res)
);

/**
 * @swagger
 * /person-documents/{id}:
 *   get:
 *     summary: Obter detalhes de um documento de pessoa
 *     tags: [PersonDocuments]
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
 *         description: Detalhes do documento de pessoa
 *       404:
 *         description: Documento não encontrado
 *       401:
 *         description: Não autorizado
 */
personDocumentRoutes.get(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID()
  ],
  validateRequest,
  (req, res) => personDocumentController.getPersonDocumentById(req, res)
);

/**
 * @swagger
 * /person-documents:
 *   get:
 *     summary: Listar documentos de pessoas
 *     tags: [PersonDocuments]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CPF, CNPJ, PASSPORT, RG, OTHER]
 *     responses:
 *       200:
 *         description: Lista de documentos de pessoas
 *       401:
 *         description: Não autorizado
 */
personDocumentRoutes.get(
  '/', 
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('person').optional().isUUID(),
    query('type').optional().isIn(['CPF', 'CNPJ', 'PASSPORT', 'RG', 'OTHER'])
  ],
  validateRequest,
  (req, res) => personDocumentController.listPersonDocuments(req, res)
);

/**
 * @swagger
 * /person-documents/{id}:
 *   put:
 *     summary: Atualizar documento de pessoa
 *     tags: [PersonDocuments]
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
 *               number:
 *                 type: string
 *               issueDate:
 *                 type: string
 *                 format: date
 *               expirationDate:
 *                 type: string
 *                 format: date
 *               issuer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documento de pessoa atualizado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Documento não encontrado
 */
personDocumentRoutes.put(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID(),
    body('number').optional().notEmpty(),
    body('issueDate').optional().isISO8601(),
    body('expirationDate').optional().isISO8601(),
  ],
  validateRequest,
  (req, res) => personDocumentController.updatePersonDocument(req, res)
);

/**
 * @swagger
 * /person-documents/{id}:
 *   delete:
 *     summary: Excluir documento de pessoa
 *     tags: [PersonDocuments]
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
 *         description: Documento de pessoa excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Documento não encontrado
 */
personDocumentRoutes.delete(
  '/:id', 
  authMiddleware,
  [
    param('id').isUUID()
  ],
  validateRequest,
  (req, res) => personDocumentController.deletePersonDocument(req, res)
);
