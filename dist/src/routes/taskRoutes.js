"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskQueue_1 = require("../queues/taskQueue");
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
router.post('/schedule', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { taskName, data, scheduledTime } = req.body;
        validateTaskInput(taskName || 'unnamed_task', data);
        const scheduledTask = await (0, taskQueue_1.publishTask)(taskName || 'unnamed_task', data || {});
        res.status(201).json({
            message: 'Tarefa agendada com sucesso',
            task: {
                taskName: taskName || 'unnamed_task',
                scheduledTime: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao agendar tarefa', error);
        res.status(500).json({
            message: 'Erro ao agendar tarefa',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map