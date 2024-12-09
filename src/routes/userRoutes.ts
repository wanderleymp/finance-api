import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos os usuários
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       401:
 *         description: Não autorizado
 */
router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        user_name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info('Listagem de usuários realizada');
    res.status(200).json(users);
  } catch (error) {
    logger.error('Erro ao listar usuários', error);
    res.status(500).json({ 
      message: 'Erro ao listar usuários', 
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obter detalhes de um usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do usuário
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        user_name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      logger.warn(`Tentativa de buscar usuário inexistente: ${id}`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    logger.info(`Detalhes do usuário obtidos: ${id}`);
    res.status(200).json(user);
  } catch (error) {
    logger.error('Erro ao buscar usuário', error);
    res.status(500).json({ 
      message: 'Erro ao buscar usuário', 
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualizar usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_name, role } = req.body;

    // Validar entrada
    if (!user_name && !role) {
      return res.status(400).json({ message: 'Nenhum dado para atualizar' });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (user_name) updateData.user_name = user_name;
    if (role) updateData.role = role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        user_name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info(`Usuário atualizado: ${id}`);
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error('Erro ao atualizar usuário', error);
    
    // Verificar se o erro é de usuário não encontrado
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(500).json({ 
      message: 'Erro ao atualizar usuário', 
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Excluir usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    logger.info(`Usuário excluído: ${id}`);
    res.status(200).json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    logger.error('Erro ao excluir usuário', error);
    
    // Verificar se o erro é de usuário não encontrado
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(500).json({ 
      message: 'Erro ao excluir usuário', 
      error: (error as Error).message 
    });
  }
});

export default router;
