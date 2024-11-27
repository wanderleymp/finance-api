const express = require('express');
const PersonController = require('../controllers/PersonController');
const PrismaPersonRepository = require('../repositories/implementations/PrismaPersonRepository');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();
const personRepository = new PrismaPersonRepository();
const personController = new PersonController(personRepository);

/**
 * @swagger
 * /persons:
 *   get:
 *     tags:
 *       - Pessoas
 *     summary: Lista pessoas com paginação e busca
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Quantidade de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo para busca em nome, nome fantasia, documentos e contatos
 *     responses:
 *       200:
 *         description: Lista de pessoas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Person'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', authenticateToken, (req, res) => personController.list(req, res));

/**
 * @swagger
 * /persons/{id}:
 *   get:
 *     tags:
 *       - Pessoas
 *     summary: Busca pessoa por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     responses:
 *       200:
 *         description: Dados da pessoa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Person'
 *                 meta:
 *                   type: object
 *       404:
 *         description: Pessoa não encontrada
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', authenticateToken, (req, res) => personController.getById(req, res));

/**
 * @swagger
 * /persons/{id}:
 *   delete:
 *     tags:
 *       - Pessoas
 *     summary: Remove uma pessoa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     responses:
 *       204:
 *         description: Pessoa removida com sucesso
 *       404:
 *         description: Pessoa não encontrada ou sem permissão
 *       500:
 *         description: Erro ao remover pessoa
 */
router.delete('/:id', authenticateToken, (req, res) => personController.delete(req, res));

/**
 * @swagger
 * /persons/cnpj:
 *   post:
 *     tags:
 *       - Pessoas
 *     summary: Cria pessoa jurídica a partir do CNPJ
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cnpj
 *             properties:
 *               cnpj:
 *                 type: string
 *                 description: CNPJ da empresa
 *     responses:
 *       201:
 *         description: Pessoa jurídica criada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Person'
 *                 meta:
 *                   type: object
 *       400:
 *         description: CNPJ inválido
 *       409:
 *         description: CNPJ já cadastrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/cnpj', authenticateToken, (req, res) => personController.createByCNPJ(req, res));

/**
 * @swagger
 * /persons/test-cnpj-api:
 *   get:
 *     tags:
 *       - Pessoas
 *     summary: Testa a API de consulta de CNPJ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cnpj
 *         required: true
 *         schema:
 *           type: string
 *         description: CNPJ para teste
 *     responses:
 *       200:
 *         description: Dados da empresa
 *       400:
 *         description: CNPJ não fornecido
 *       500:
 *         description: Erro ao consultar API
 */
router.get('/test-cnpj-api', authenticateToken, (req, res) => personController.testCNPJAPI(req, res));

/**
 * @swagger
 * /persons/consulta/cnpj/{cnpj}:
 *   get:
 *     tags:
 *       - Pessoas
 *     summary: Consulta dados de empresa por CNPJ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cnpj
 *         required: true
 *         schema:
 *           type: string
 *         description: CNPJ para consulta
 *     responses:
 *       200:
 *         description: Dados da empresa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     nome:
 *                       type: string
 *                     cnpj:
 *                       type: string
 *                     email:
 *                       type: string
 *                     telefone:
 *                       type: string
 *                     situacao:
 *                       type: string
 *       400:
 *         description: CNPJ inválido
 *       500:
 *         description: Erro ao consultar API
 */
router.get('/consulta/cnpj/:cnpj', authenticateToken, (req, res) => personController.consultaCNPJ(req, res));

/**
 * @swagger
 * /persons/consulta/cep/{cep}:
 *   get:
 *     tags:
 *       - Pessoas
 *     summary: Consulta endereço por CEP
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cep
 *         required: true
 *         schema:
 *           type: string
 *         description: CEP para consulta
 *     responses:
 *       200:
 *         description: Dados do endereço
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cep:
 *                       type: string
 *                     logradouro:
 *                       type: string
 *                     complemento:
 *                       type: string
 *                     bairro:
 *                       type: string
 *                     cidade:
 *                       type: string
 *                     estado:
 *                       type: string
 *                     ibge:
 *                       type: string
 *                     ddd:
 *                       type: string
 *       400:
 *         description: CEP inválido
 *       500:
 *         description: Erro ao consultar API
 */
router.get('/consulta/cep/:cep', authenticateToken, (req, res) => personController.consultaCEP(req, res));

/**
 * @swagger
 * /persons/{id}/contacts:
 *   get:
 *     tags:
 *       - Pessoas
 *     summary: Lista os contatos de uma pessoa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     responses:
 *       200:
 *         description: Lista de contatos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       type:
 *                         type: string
 *                       value:
 *                         type: string
 *                       name:
 *                         type: string
 *                 meta:
 *                   type: object
 *       404:
 *         description: Pessoa não encontrada ou sem permissão
 *       500:
 *         description: Erro ao listar contatos
 */
router.get('/:id/contacts', authenticateToken, (req, res) => personController.listContacts(req, res));

/**
 * @swagger
 * /persons:
 *   post:
 *     tags:
 *       - Pessoas
 *     summary: Cria uma nova pessoa
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - full_name
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [PHYSICAL, LEGAL]
 *                 description: Tipo de pessoa (física ou jurídica)
 *               full_name:
 *                 type: string
 *                 description: Nome completo ou razão social
 *               fantasy_name:
 *                 type: string
 *                 description: Nome fantasia (apenas para pessoa jurídica)
 *               birth_date:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento ou fundação
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - value
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [CPF, CNPJ, RG]
 *                     value:
 *                       type: string
 *               addresses:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Address'
 *               cnaes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CNAE'
 *               tax_regime:
 *                 $ref: '#/components/schemas/TaxRegime'
 *     responses:
 *       201:
 *         description: Pessoa criada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Person'
 *                 meta:
 *                   type: object
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authenticateToken, (req, res) => personController.create(req, res));

module.exports = router;
