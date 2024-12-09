import { Router, Request, Response } from 'express';
import { scheduleTask } from '../services/taskService';
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
 * /api/tasks:
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
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/tasks', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { taskName, payload } = req.body;

    // Validação de entrada
    validateTaskInput(taskName, payload);

    await scheduleTask(taskName, payload || {});

    logger.info(`Tarefa ${taskName} agendada por usuário admin`);
    res.status(201).json({ 
      message: 'Tarefa agendada com sucesso!',
      taskName 
    });
  } catch (error) {
    logger.error('Erro ao agendar tarefa', error);
    
    // Tratamento de diferentes tipos de erro
    const errorMessage = (error as Error).message;
    const statusCode = errorMessage.includes('taskName') || 
                       errorMessage.includes('Payload') ? 400 : 500;

    res.status(statusCode).json({ 
      message: errorMessage, 
      error: errorMessage 
    });
  }
});

export default router;
