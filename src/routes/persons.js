const express = require('express');
const PersonController = require('../controllers/PersonController');
const PrismaPersonRepository = require('../repositories/implementations/PrismaPersonRepository');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();
const personRepository = new PrismaPersonRepository();
const personController = new PersonController(personRepository);

/**
 * @swagger
 * components:
 *   schemas:
 *     Person:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID da pessoa
 *         full_name:
 *           type: string
 *           description: Nome completo/Razão social
 *         fantasy_name:
 *           type: string
 *           description: Nome fantasia
 *         person_type:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               value:
 *                 type: string
 *         address:
 *           type: object
 *           properties:
 *             postal_code:
 *               type: string
 *             street:
 *               type: string
 *             number:
 *               type: string
 *             complement:
 *               type: string
 *             neighborhood:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *         contacts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               type:
 *                 type: string
 *               value:
 *                 type: string
 *               name:
 *                 type: string
 *         qsa:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               document:
 *                 type: string
 *         cnaes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               primary:
 *                 type: boolean
 *         tax_regime:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             description:
 *               type: string
 *     
 *     PersonInput:
 *       type: object
 *       required:
 *         - full_name
 *         - person_type_id
 *         - documents
 *       properties:
 *         full_name:
 *           type: string
 *           description: Nome completo/Razão social
 *         fantasy_name:
 *           type: string
 *           description: Nome fantasia
 *         person_type_id:
 *           type: integer
 *           description: ID do tipo de pessoa (1=PF, 2=PJ)
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - type_id
 *               - value
 *             properties:
 *               type_id:
 *                 type: integer
 *               value:
 *                 type: string
 *         address:
 *           type: object
 *           properties:
 *             postal_code:
 *               type: string
 *             street:
 *               type: string
 *             number:
 *               type: string
 *             complement:
 *               type: string
 *             neighborhood:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *         contacts:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - type_id
 *               - value
 *             properties:
 *               type_id:
 *                 type: integer
 *               value:
 *                 type: string
 *               name:
 *                 type: string
 *     
 *     ContactInput:
 *       type: object
 *       required:
 *         - type_id
 *         - value
 *       properties:
 *         type_id:
 *           type: integer
 *           description: ID do tipo de contato
 *         value:
 *           type: string
 *           description: Valor do contato
 *         name:
 *           type: string
 *           description: Nome/descrição do contato
 *     
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total de registros
 *         page:
 *           type: integer
 *           description: Página atual
 *         limit:
 *           type: integer
 *           description: Registros por página
 *         pages:
 *           type: integer
 *           description: Total de páginas
 *     
 *     Document:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do documento
 *         person_id:
 *           type: integer
 *           description: ID da pessoa
 *         document_type:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             mask:
 *               type: string
 *             validation_regex:
 *               type: string
 *         value:
 *           type: string
 *           description: Valor do documento
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

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
 *           default: 10
 *         description: Quantidade de registros por página
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
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       404:
 *         description: Pessoa não encontrada
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id/contacts', authenticateToken, (req, res) => personController.listContacts(req, res));

/**
 * @swagger
 * /persons/{id}/contacts:
 *   post:
 *     tags:
 *       - Pessoas
 *     summary: Adiciona um contato à pessoa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactInput'
 *     responses:
 *       201:
 *         description: Contato adicionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Pessoa não encontrada
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/contacts', authenticateToken, (req, res) => personController.addContact(req, res));

/**
 * @swagger
 * /persons/{personId}/contacts/{contactId}:
 *   delete:
 *     tags:
 *       - Pessoas
 *     summary: Remove um contato de uma pessoa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do contato
 *     responses:
 *       204:
 *         description: Contato removido com sucesso
 *       404:
 *         description: Contato não encontrado ou sem permissão
 *       500:
 *         description: Erro ao remover contato
 */
router.delete('/:personId/contacts/:contactId', authenticateToken, (req, res) => personController.removeContact(req, res));

/**
 * @swagger
 * /persons/{id}/documents:
 *   get:
 *     tags:
 *       - Pessoas
 *     summary: Lista documentos de uma pessoa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de documentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       404:
 *         description: Pessoa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id/documents', authenticateToken, (req, res) => personController.listDocuments(req, res));

/**
 * @swagger
 * /persons/{id}/documents:
 *   post:
 *     tags:
 *       - Pessoas
 *     summary: Adiciona um documento à pessoa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type_id
 *               - value
 *             properties:
 *               type_id:
 *                 type: integer
 *                 description: ID do tipo de documento
 *               value:
 *                 type: string
 *                 description: Valor do documento
 *     responses:
 *       201:
 *         description: Documento adicionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Pessoa ou tipo de documento não encontrado
 *       409:
 *         description: Pessoa já possui documento deste tipo
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/documents', authenticateToken, (req, res) => personController.addDocument(req, res));

/**
 * @swagger
 * /persons/{personId}/documents/{documentId}:
 *   delete:
 *     tags:
 *       - Pessoas
 *     summary: Remove um documento de uma pessoa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do documento
 *     responses:
 *       204:
 *         description: Documento removido
 *       404:
 *         description: Pessoa ou documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:personId/documents/:documentId', authenticateToken, (req, res) => personController.removeDocument(req, res));

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
 *             $ref: '#/components/schemas/PersonInput'
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
