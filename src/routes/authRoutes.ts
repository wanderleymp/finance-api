import { Router, Request, Response } from 'express';
import { registerAdmin, authenticateUser } from '../services/authService';
import { authMiddleware } from '../middleware/authMiddleware';
import logger from '../config/logger';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar usuário administrador inicial
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - password
 *             properties:
 *               user_name:
 *                 type: string
 *                 description: Nome de usuário único
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       400:
 *         description: Erro de validação
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { user_name, password } = req.body;
    logger.info(`Tentativa de registro: ${JSON.stringify(req.body)}`);
    logger.info(`IP do cliente: ${req.ip}, Headers: ${JSON.stringify(req.headers)}`);

    // Validações básicas
    if (!user_name || !password) {
      logger.warn('Registro inválido: campos incompletos');
      return res.status(400).json({ 
        message: 'Nome de usuário e senha são obrigatórios' 
      });
    }

    // Registrar usuário admin
    const token = await registerAdmin(user_name, password);

    logger.info(`Usuário ${user_name} registrado com sucesso`);
    res.status(201).json({ 
      message: 'Usuário administrador registrado com sucesso', 
      token 
    });
  } catch (error) {
    logger.error('Erro no registro de admin', error);
    res.status(500).json({ 
      message: 'Erro ao registrar usuário', 
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - password
 *             properties:
 *               user_name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       401:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { user_name, password } = req.body;
    logger.info(`Tentativa de login: ${JSON.stringify(req.body)}`);
    logger.info(`IP do cliente: ${req.ip}, Headers: ${JSON.stringify(req.headers)}`);

    // Validações básicas
    if (!user_name || !password) {
      logger.warn('Login inválido: campos incompletos');
      return res.status(400).json({ 
        message: 'Nome de usuário e senha são obrigatórios' 
      });
    }

    // Autenticar usuário
    const token = await authenticateUser(user_name, password);

    logger.info(`Usuário ${user_name} autenticado com sucesso`);
    res.status(200).json({ 
      message: 'Login realizado com sucesso', 
      token 
    });
  } catch (error) {
    logger.error('Erro no login', error);
    res.status(401).json({ 
      message: 'Credenciais inválidas', 
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout do usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       401:
 *         description: Não autorizado
 */
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  // No JWT stateless, o logout é feito no cliente (remover token)
  logger.info('Logout realizado');
  res.status(200).json({ 
    message: 'Logout realizado com sucesso' 
  });
});

export default router;
