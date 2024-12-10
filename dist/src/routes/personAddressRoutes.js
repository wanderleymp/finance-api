"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personAddressRoutes = void 0;
const express_1 = require("express");
const personAddressController_1 = require("../controllers/personAddressController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const express_validator_1 = require("express-validator");
exports.personAddressRoutes = (0, express_1.Router)();
const personAddressController = new personAddressController_1.PersonAddressController();
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
exports.personAddressRoutes.post('/', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.body)('person').isUUID(),
    (0, express_validator_1.body)('street').notEmpty(),
    (0, express_validator_1.body)('neighborhood').notEmpty(),
    (0, express_validator_1.body)('city').notEmpty(),
    (0, express_validator_1.body)('state').notEmpty(),
    (0, express_validator_1.body)('zipCode').notEmpty(),
], validationMiddleware_1.validateRequest, (req, res) => personAddressController.createPersonAddress(req, res));
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
exports.personAddressRoutes.get('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID()
], validationMiddleware_1.validateRequest, (req, res) => personAddressController.getPersonAddressById(req, res));
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
exports.personAddressRoutes.get('/', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('person').optional().isUUID(),
    (0, express_validator_1.query)('city').optional().isString(),
    (0, express_validator_1.query)('state').optional().isString()
], validationMiddleware_1.validateRequest, (req, res) => personAddressController.listPersonAddresses(req, res));
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
exports.personAddressRoutes.put('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('street').optional().notEmpty(),
    (0, express_validator_1.body)('neighborhood').optional().notEmpty(),
    (0, express_validator_1.body)('city').optional().notEmpty(),
    (0, express_validator_1.body)('state').optional().notEmpty(),
    (0, express_validator_1.body)('zipCode').optional().notEmpty(),
], validationMiddleware_1.validateRequest, (req, res) => personAddressController.updatePersonAddress(req, res));
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
exports.personAddressRoutes.delete('/:id', authMiddleware_1.authMiddleware, [
    (0, express_validator_1.param)('id').isUUID()
], validationMiddleware_1.validateRequest, (req, res) => personAddressController.deletePersonAddress(req, res));
//# sourceMappingURL=personAddressRoutes.js.map