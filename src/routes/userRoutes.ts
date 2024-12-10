import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

console.log(' Carregando rotas de usuários');
logger.info('Carregando rotas de usuários');

// Middleware de log adicional para depuração
router.use((req, res, next) => {
  console.log(` DEBUG - Rota de usuário acessada: ${req.method} ${req.path}`);
  console.log(` DEBUG - Headers: ${JSON.stringify(req.headers, null, 2)}`);
  next();
});

/**
 * @swagger
 * /users:
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
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    console.log(' DEBUG - Rota de usuários acessada');
    console.log(' DEBUG - Usuário autenticado:', (req as any).user);
    logger.info('Tentativa de listagem de usuários');

    // Temporariamente, apenas retorna uma mensagem de sucesso
    res.status(200).json({ 
      message: 'Rota de usuários acessada com sucesso', 
      user: (req as any).user 
    });
  } catch (error) {
    console.error(' DEBUG - Erro na rota de usuários:', error);
    logger.error('Erro ao listar usuários', error);
    res.status(500).json({ 
      message: 'Erro ao acessar rota de usuários', 
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /users/{id}:
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
router.get('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    console.log(' DEBUG - Rota de detalhes de usuário acessada');
    logger.info('Tentativa de buscar usuário');

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
      console.log(' DEBUG - Usuário não encontrado:', id);
      logger.warn(`Tentativa de buscar usuário inexistente: ${id}`);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    logger.info(`Detalhes do usuário obtidos: ${id}`);
    res.status(200).json(user);
  } catch (error) {
    console.error(' DEBUG - Erro na rota de detalhes de usuário:', error);
    logger.error('Erro ao buscar usuário', error);
    res.status(500).json({ 
      message: 'Erro ao buscar usuário', 
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /users/{id}:
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
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    console.log(' DEBUG - Rota de atualização de usuário acessada');
    logger.info('Tentativa de atualizar usuário');

    const { id } = req.params;
    const { user_name, role } = req.body;

    // Validar entrada
    if (!user_name && !role) {
      console.log(' DEBUG - Nenhum dado para atualizar');
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
    console.error(' DEBUG - Erro na rota de atualização de usuário:', error);
    logger.error('Erro ao atualizar usuário', error);
    
    // Verificar se o erro é de usuário não encontrado
    if ((error as any).code === 'P2025') {
      console.log(' DEBUG - Usuário não encontrado:', (error as any).meta.target);
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
 * /users/{id}:
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
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    console.log(' DEBUG - Rota de exclusão de usuário acessada');
    logger.info('Tentativa de excluir usuário');

    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    logger.info(`Usuário excluído: ${id}`);
    res.status(200).json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error(' DEBUG - Erro na rota de exclusão de usuário:', error);
    logger.error('Erro ao excluir usuário', error);
    
    // Verificar se o erro é de usuário não encontrado
    if ((error as any).code === 'P2025') {
      console.log(' DEBUG - Usuário não encontrado:', (error as any).meta.target);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(500).json({ 
      message: 'Erro ao excluir usuário', 
      error: (error as Error).message 
    });
  }
});

export default router;
