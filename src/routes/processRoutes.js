const express = require('express');
const router = express.Router();
const ProcessController = require('../controllers/ProcessController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplica middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /processes:
 *   post:
 *     summary: Cria um novo processo
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - process_type_id
 *               - reference_table
 *               - reference_id
 *             properties:
 *               process_type_id:
 *                 type: integer
 *                 description: ID do tipo de processo
 *               reference_table:
 *                 type: string
 *                 description: Tabela de referência do processo
 *               reference_id:
 *                 type: integer
 *                 description: ID do registro de referência
 *               additional_data:
 *                 type: object
 *                 description: Dados adicionais do processo
 *     responses:
 *       201:
 *         description: Processo criado com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', ProcessController.createProcess);

/**
 * @swagger
 * /processes/tasks/{process_task_id}:
 *   post:
 *     summary: Executa uma tarefa de processo
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: process_task_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Dados de execução da tarefa
 *     responses:
 *       200:
 *         description: Tarefa executada com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/tasks/:process_task_id', ProcessController.executeProcessTask);

/**
 * @swagger
 * /processes:
 *   get:
 *     summary: Lista processos
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, running, completed, failed]
 *       - in: query
 *         name: process_type_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de processos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', ProcessController.listProcesses);

module.exports = router;
