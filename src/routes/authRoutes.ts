import { Router, Request, Response } from 'express';
import { registerAdmin, authenticateUser, verifyToken } from '../services/authService';
import { validateLogin, validateRegistration } from '../middleware/validationMiddleware';
import { authMiddleware, loginAttemptMiddleware } from '../middleware/authMiddleware';
import logger from '../config/logger';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar administrador
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
 *       201:
 *         description: Administrador registrado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/register', validateRegistration, async (req: Request, res: Response) => {
  try {
    const { user_name, password } = req.body;
    
    logger.info('Tentativa de registro de administrador', { user_name });
    
    const token = await registerAdmin(user_name, password);
    
    res.status(201).json({ 
      message: 'Administrador registrado com sucesso', 
      token 
    });
  } catch (error) {
    logger.error('Erro no registro de administrador', error);
    res.status(500).json({ 
      message: 'Erro ao registrar administrador',
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login de administrador
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
 *         description: Login realizado com sucesso
 *       400:
 *         description: Credenciais inválidas
 */
router.post('/login', loginAttemptMiddleware, validateLogin, async (req: Request, res: Response) => {
  try {
    const { user_name, password } = req.body;
    
    logger.info('Tentativa de login de administrador', { user_name });
    
    const token = await authenticateUser(user_name, password);
    
    res.status(200).json({ 
      message: 'Login realizado com sucesso', 
      token 
    });
  } catch (error) {
    logger.error('Erro no login de administrador', error);
    res.status(401).json({ 
      message: 'Erro no login',
      error: (error as Error).message 
    });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verificar token de autenticação
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido
 */
router.post('/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    const decoded = await verifyToken(token);
    
    res.status(200).json({ 
      message: 'Token válido', 
      user: decoded 
    });
  } catch (error) {
    logger.error('Erro na verificação do token', error);
    res.status(401).json({ 
      message: 'Token inválido',
      error: (error as Error).message 
    });
  }
});

export default router;
