const express = require('express');
const router = express.Router();
const TasksController = require('../controllers/tasksController');
const container = require('../config/container');

const tasksController = container.resolve('tasksController');

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Lista todas as tasks
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de items por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Tipo da task
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status da task
 */
router.get('/', (req, res) => tasksController.listTasks(req, res));

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Busca uma task por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da task
 */
router.get('/:id', (req, res) => tasksController.getTaskStatus(req, res));

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Cria uma nova task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - payload
 *             properties:
 *               type:
 *                 type: string
 *               payload:
 *                 type: object
 *               options:
 *                 type: object
 */
router.post('/', (req, res) => tasksController.createTask(req, res));

/**
 * @swagger
 * /api/tasks/metrics:
 *   get:
 *     summary: Retorna métricas das tasks
 */
router.get('/metrics', (req, res) => tasksController.getMetrics(req, res));

/**
 * @swagger
 * /api/tasks/{id}/process:
 *   post:
 *     summary: Processa uma task manualmente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da task
 */
router.post('/:id/process', (req, res) => tasksController.processTask(req, res));

module.exports = router;
