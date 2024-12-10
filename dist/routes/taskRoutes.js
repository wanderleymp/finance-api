"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskService_1 = require("../services/taskService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const logger_1 = __importDefault(require("../config/logger"));
const router = (0, express_1.Router)();
function validateTaskInput(taskName, payload) {
    if (!taskName || typeof taskName !== 'string') {
        throw new Error('taskName deve ser uma string não vazia');
    }
    if (payload && typeof payload !== 'object') {
        throw new Error('Payload deve ser um objeto válido');
    }
}
/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Agendar nova tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskName
 *             properties:
 *               taskName:
 *                 type: string
 *                 description: Nome da tarefa a ser agendada
 *               payload:
 *                 type: object
 *                 description: Dados adicionais da tarefa
 *     responses:
 *       201:
 *         description: Tarefa agendada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 taskName:
 *                   type: string
 *       400:
 *         description: Erro na validação dos dados
 *       401:
 *         description: Não autorizado
 */
router.post('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        const { taskName, payload } = req.body;
        validateTaskInput(taskName, payload);
        const scheduledTask = await (0, taskService_1.scheduleTask)(taskName, payload);
        logger_1.default.info(`Tarefa agendada: ${taskName}`);
        res.status(201).json({
            message: 'Tarefa agendada com sucesso',
            taskName: scheduledTask.name
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao agendar tarefa', error);
        if (error instanceof Error) {
            return res.status(400).json({
                message: 'Erro na validação dos dados',
                error: error.message
            });
        }
        res.status(500).json({
            message: 'Erro interno do servidor',
            error: 'Falha ao agendar tarefa'
        });
    }
});
exports.default = router;
