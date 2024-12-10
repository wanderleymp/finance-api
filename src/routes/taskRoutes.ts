import { Router, Request, Response } from 'express';
import { publishTask as publishTaskQueue } from '../queues/taskQueue';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import logger from '../config/logger';

const router = Router();

function validateTaskInput(taskName: string, payload: any) {
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
router.post('/schedule', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { taskName, data, scheduledTime } = req.body;

    validateTaskInput(taskName || 'unnamed_task', data);

    const scheduledTask = await publishTaskQueue(
      taskName || 'unnamed_task', 
      data || {}
    );

    res.status(201).json({ 
      message: 'Tarefa agendada com sucesso',
      task: {
        taskName: taskName || 'unnamed_task', 
        scheduledTime: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Erro ao agendar tarefa', error);
    res.status(500).json({ 
      message: 'Erro ao agendar tarefa', 
      error: (error as Error).message 
    });
  }
});

export default router;
