const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { taskProcessorService } = require('../services/task-processor.service');

const prisma = new PrismaClient();

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
        const { 
            name, 
            description, 
            type, 
            processId, 
            metadata 
        } = req.body;

        const task = await taskProcessorService.enqueueTask({
            name,
            description,
            processId,
            type,
            metadata
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Erro ao criar tarefa', error);
        res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
});

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
        const { 
            page = 1, 
            limit = 10, 
            status 
        } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);

        const where = status ? { status_id: Number(status) } : {};

        const tasks = await prisma.tasks.findMany({
            where,
            include: {
                tasks_status: true
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { 
                created_at: 'desc' 
            }
        });

        const total = await prisma.tasks.count({ where });

        res.json({
            tasks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
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
        const { id } = req.params;
        const task = await prisma.tasks.findUnique({
            where: { task_id: Number(id) },
            include: {
                tasks_status: true,
                task_logs: true
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }

        res.json(task);
    } catch (error) {
        console.error('Erro ao buscar tarefa', error);
        res.status(500).json({ error: 'Erro ao buscar tarefa' });
    }
});

module.exports = router;
