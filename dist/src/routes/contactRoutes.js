"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRoutes = void 0;
const express_1 = require("express");
const contactController_1 = require("../controllers/contactController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const express_validator_1 = require("express-validator");
exports.contactRoutes = (0, express_1.Router)();
const contactController = new contactController_1.ContactController();
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
exports.contactRoutes.post('/', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.body)('type').isIn(['PHONE', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'OTHER']),
    (0, express_validator_1.body)('value').notEmpty(),
], validationMiddleware_1.validateRequest, (req, res) => contactController.createContact(req, res));
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
exports.contactRoutes.get('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID()
], validationMiddleware_1.validateRequest, (req, res) => contactController.getContactById(req, res));
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
exports.contactRoutes.get('/', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('type').optional().isIn(['PHONE', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'OTHER'])
], validationMiddleware_1.validateRequest, (req, res) => contactController.listContacts(req, res));
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
exports.contactRoutes.put('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('type').optional().isIn(['PHONE', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'OTHER']),
    (0, express_validator_1.body)('value').optional().notEmpty()
], validationMiddleware_1.validateRequest, (req, res) => contactController.updateContact(req, res));
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
exports.contactRoutes.delete('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID()
], validationMiddleware_1.validateRequest, (req, res) => contactController.deleteContact(req, res));
//# sourceMappingURL=contactRoutes.js.map