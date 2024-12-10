import { Router } from 'express';
import { PersonController } from '../controllers/personController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest, schemas } from '../middleware/validationMiddleware';

export const personRoutes = Router();
const personController = new PersonController();

personRoutes.use(authMiddleware);

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
personRoutes.post("/", validateRequest(schemas.person), (req, res) => personController.create(req, res));

/**
 * @swagger
 * /persons/cnpj/{cnpj}:
 *   post:
 *     summary: Salvar ou atualizar pessoa por CNPJ
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: cnpj
 *         required: true
 *         schema:
 *           type: string
 *         description: CNPJ da empresa
 *     responses:
 *       200:
 *         description: Pessoa salva ou atualizada com sucesso
 *       400:
 *         description: CNPJ inválido
 *       401:
 *         description: Não autorizado
 *       422:
 *         description: Erro na consulta de CNPJ
 */
personRoutes.post("/cnpj/:cnpj", (req, res) => personController.saveByCnpj(req, res));

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
personRoutes.get("/", (req, res) => personController.list(req, res));

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
personRoutes.get("/:id", (req, res) => personController.findById(req, res));

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
personRoutes.put("/:id", validateRequest(schemas.person), (req, res) => personController.update(req, res));

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
personRoutes.delete("/:id", (req, res) => personController.delete(req, res));
