"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const personController_1 = require("../controllers/personController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const personRoutes = (0, express_1.Router)();
const personController = new personController_1.PersonController();
personRoutes.use(authMiddleware_1.authMiddleware);
/**
 * @swagger
 * /persons:
 *   post:
 *     summary: Criar uma nova pessoa
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Pessoa criada com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 */
personRoutes.post('/', (0, validationMiddleware_1.validateRequest)(validationMiddleware_1.schemas.person), personController.createPerson);
/**
 * @swagger
 * /persons:
 *   get:
 *     summary: Listar pessoas
 *     tags: [Persons]
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
 *         name: name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de pessoas
 *       401:
 *         description: Não autorizado
 */
personRoutes.get('/', personController.findPersons);
/**
 * @swagger
 * /persons/{id}:
 *   get:
 *     summary: Obter detalhes de uma pessoa
 *     tags: [Persons]
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
 *         description: Detalhes da pessoa
 *       404:
 *         description: Pessoa não encontrada
 *       401:
 *         description: Não autorizado
 */
personRoutes.get('/:id', personController.getPersonById);
/**
 * @swagger
 * /persons/{id}:
 *   put:
 *     summary: Atualizar pessoa
 *     tags: [Persons]
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
 *               name:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Pessoa atualizada com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Pessoa não encontrada
 */
personRoutes.put('/:id', (0, validationMiddleware_1.validateRequest)(validationMiddleware_1.schemas.person), personController.updatePerson);
/**
 * @swagger
 * /persons/{id}:
 *   delete:
 *     summary: Excluir pessoa
 *     tags: [Persons]
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
 *         description: Pessoa excluída com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Pessoa não encontrada
 */
personRoutes.delete('/:id', personController.deletePerson);
exports.default = personRoutes;
//# sourceMappingURL=personRoutes.js.map