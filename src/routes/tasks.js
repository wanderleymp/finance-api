const express = require('express');
const router = express.Router();
const { taskProcessorService } = require('../services/task-processor.service');
const authenticateToken = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Lista todas as tarefas
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página de resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número de resultados por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: ID do status da tarefa
 *     responses:
 *       200:
 *         description: Lista de tarefas
 *       500:
 *         description: Erro ao listar tarefas
 */
router.get('/', async (req, res) => {
    try {
        const { page, limit, status } = req.query;
        const result = await taskProcessorService.listTasks(
            { status },
            { page, limit }
        );
        res.json(result);
    } catch (error) {
        console.error('Erro ao listar tarefas', error);
        res.status(500).json({ error: 'Erro ao listar tarefas' });
    }
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Busca tarefa por ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes da tarefa
 *       404:
 *         description: Tarefa não encontrada
 *       500:
 *         description: Erro ao buscar tarefa
 */
router.get('/:id', async (req, res) => {
    try {
        const task = await taskProcessorService.getTaskById(req.params.id);
        res.json(task);
    } catch (error) {
        if (error.message === 'Task not found') {
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        console.error('Erro ao buscar tarefa', error);
        res.status(500).json({ error: 'Erro ao buscar tarefa' });
    }
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Cria uma nova tarefa
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               processId:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso
 *       500:
 *         description: Erro ao criar tarefa
 */
router.post('/', async (req, res) => {
    try {
        const task = await taskProcessorService.enqueueTask(req.body);
        res.status(201).json(task);
    } catch (error) {
        console.error('Erro ao criar tarefa', error);
        res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
});

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     summary: Atualiza o status de uma tarefa
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       404:
 *         description: Tarefa não encontrada
 *       500:
 *         description: Erro ao atualizar status
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;
        const task = await taskProcessorService.updateTaskStatus(id, status, message);
        res.json(task);
    } catch (error) {
        if (error.message === 'Task not found') {
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        console.error('Erro ao atualizar status da tarefa', error);
        res.status(500).json({ error: 'Erro ao atualizar status da tarefa' });
    }
});

/**
 * @swagger
 * /tasks/{id}/errors:
 *   get:
 *     summary: Lista os erros de uma tarefa
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de erros da tarefa
 *       500:
 *         description: Erro ao buscar erros
 */
router.get('/:id/errors', async (req, res) => {
    try {
        const errors = await taskProcessorService.getTaskErrors(req.params.id);
        res.json(errors);
    } catch (error) {
        console.error('Erro ao buscar erros da tarefa', error);
        res.status(500).json({ error: 'Erro ao buscar erros da tarefa' });
    }
});

module.exports = router;
