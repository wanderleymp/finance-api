"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personContactRoutes = void 0;
const express_1 = require("express");
const personContactController_1 = require("../controllers/personContactController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const express_validator_1 = require("express-validator");
exports.personContactRoutes = (0, express_1.Router)();
const personContactController = new personContactController_1.PersonContactController();
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
exports.personContactRoutes.post('/', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.body)('person').isUUID(),
    (0, express_validator_1.body)('contactId').isUUID(),
    (0, express_validator_1.body)('nickname').optional().isString(),
    (0, express_validator_1.body)('isPrimary').optional().isBoolean()
], validationMiddleware_1.validateRequest, (req, res) => personContactController.createPersonContact(req, res));
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
exports.personContactRoutes.get('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID()
], validationMiddleware_1.validateRequest, (req, res) => personContactController.getPersonContactById(req, res));
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
exports.personContactRoutes.get('/', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('person').optional().isUUID(),
    (0, express_validator_1.query)('contactId').optional().isUUID()
], validationMiddleware_1.validateRequest, (req, res) => personContactController.findPersonContacts(req, res));
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
exports.personContactRoutes.put('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('nickname').optional().isString(),
    (0, express_validator_1.body)('isPrimary').optional().isBoolean()
], validationMiddleware_1.validateRequest, (req, res) => personContactController.updatePersonContact(req, res));
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
exports.personContactRoutes.delete('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID()
], validationMiddleware_1.validateRequest, (req, res) => personContactController.deletePersonContact(req, res));
//# sourceMappingURL=personContactRoutes.js.map