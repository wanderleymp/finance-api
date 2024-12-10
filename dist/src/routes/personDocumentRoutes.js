"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personDocumentRoutes = void 0;
const express_1 = require("express");
const personDocumentController_1 = require("../controllers/personDocumentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const express_validator_1 = require("express-validator");
exports.personDocumentRoutes = (0, express_1.Router)();
const personDocumentController = new personDocumentController_1.PersonDocumentController();
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
exports.personDocumentRoutes.post('/', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.body)('person').isUUID(),
    (0, express_validator_1.body)('type').isIn(['CPF', 'CNPJ', 'PASSPORT', 'RG', 'OTHER']),
    (0, express_validator_1.body)('number').notEmpty(),
    (0, express_validator_1.body)('issueDate').optional().isISO8601(),
    (0, express_validator_1.body)('expirationDate').optional().isISO8601(),
], validationMiddleware_1.validateRequest, (req, res) => personDocumentController.createPersonDocument(req, res));
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
exports.personDocumentRoutes.get('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID()
], validationMiddleware_1.validateRequest, (req, res) => personDocumentController.getPersonDocumentById(req, res));
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
exports.personDocumentRoutes.get('/', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('person').optional().isUUID(),
    (0, express_validator_1.query)('type').optional().isIn(['CPF', 'CNPJ', 'PASSPORT', 'RG', 'OTHER'])
], validationMiddleware_1.validateRequest, (req, res) => personDocumentController.listPersonDocuments(req, res));
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
exports.personDocumentRoutes.put('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('number').optional().notEmpty(),
    (0, express_validator_1.body)('issueDate').optional().isISO8601(),
    (0, express_validator_1.body)('expirationDate').optional().isISO8601(),
], validationMiddleware_1.validateRequest, (req, res) => personDocumentController.updatePersonDocument(req, res));
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
exports.personDocumentRoutes.delete('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID()
], validationMiddleware_1.validateRequest, (req, res) => personDocumentController.deletePersonDocument(req, res));
//# sourceMappingURL=personDocumentRoutes.js.map