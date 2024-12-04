const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const logger = require('../../config/logger');
const PrismaUserRepository = require('../repositories/implementations/PrismaUserRepository');
const authenticateToken = require('../middlewares/authMiddleware');

const userRepository = new PrismaUserRepository();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     description: Autentica um usuário usando username/email e senha, retornando um token JWT e dados completos do usuário
 *     tags: [Auth]
 *     servers:
 *       - url: https://api.agilefinance.com.br
 *         description: Servidor de produção
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username ou email do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *             example:
 *               identifier: "admin@example.com"
 *               password: "123456"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/login', async (req, res) => {
    const startTime = Date.now();
    const { identifier, password } = req.body;

    try {
        // Busca o usuário por username ou qualquer valor de contato
        const user = await userRepository.findByIdentifier(identifier);
        
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verifica se tem senha
        if (!user.password) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        // Verifica a senha
        const validPassword = await argon2.verify(user.password, password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        let token;
        try {
            // Gera o token JWT
            token = jwt.sign(
                { 
                    id: user.user_id, 
                    username: user.username,
                    role: user.role,
                    profile_id: user.profile_id
                }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1h' }
            );
        } catch (error) {
            logger.error('Erro ao gerar token:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        return res.status(200).json({
            token
        });
    } catch (error) {
        logger.error('Erro durante autenticação:', {
            mensagem: error.message,
            tipo: error.name,
            stack: error.stack?.split('\n')
        });
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado
 *     description: Retorna os dados completos do usuário autenticado usando o token JWT
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autorizado
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        return res.status(200).json(req.user);
    } catch (error) {
        logger.error('Erro ao buscar dados do usuário:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renovar token JWT
 *     description: Renova o token JWT atual por um novo token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Novo token JWT
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Token inválido ou expirado
 */
router.post('/refresh', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Tentativa de renovação de token sem token de autenticação');
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    try {
        // Verifica se o token atual é válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Gera um novo token com os mesmos dados
        const newToken = jwt.sign(
            {
                user_id: decoded.user_id,
                username: decoded.username,
                profile_id: decoded.profile_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        logger.info(`Token renovado com sucesso para o usuário ${decoded.username}`);
        res.json({ token: newToken });
    } catch (error) {
        logger.error(`Erro ao renovar token: ${error.message}`);
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
});

module.exports = router;
