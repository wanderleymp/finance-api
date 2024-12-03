const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const logger = require('../../config/logger');
const PrismaUserRepository = require('../repositories/implementations/PrismaUserRepository');
const { getUserById } = require('../controllers/usersController');
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
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     profile:
 *                       type: object
 *                     person:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         full_name:
 *                           type: string
 *                         fantasy_name:
 *                           type: string
 *                         birth_date:
 *                           type: string
 *                         contacts:
 *                           type: object
 *                           properties:
 *                             byType:
 *                               type: object
 *                             list:
 *                               type: array
 *                         documents:
 *                           type: array
 *                         licenses:
 *                           type: array
 *                         address:
 *                           type: object
 *                         tax_regime:
 *                           type: object
 *                         type:
 *                           type: string
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
        console.log('=== INÍCIO DO LOGIN ===');
        console.log('Dados recebidos:', { identifier, temSenha: !!password });
        
        // Busca o usuário por username ou qualquer valor de contato
        const user = await userRepository.findByIdentifier(identifier);
        
        if (!user) {
            console.log('Usuário não encontrado');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        console.log('Resultado da busca:', { 
            encontrado: true,
            id: user.user_id,
            username: user.username,
            temSenha: !!user.password,
            hashDaSenha: user.password?.substring(0, 10) + '...'
        });

        console.log('Verificando senha com Argon2...');
        
        // Verifica se tem senha
        if (!user.password) {
            console.log('Usuário não tem senha definida');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        // Verifica a senha usando Argon2
        const validPassword = await argon2.verify(user.password, password);
        
        console.log('Resultado da verificação:', { senhaCorreta: validPassword });
        
        if (!validPassword) {
            console.log('Senha incorreta');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Debug: Verificar JWT
        console.log('=== DEBUG JWT ===');
        console.log('JWT_SECRET definido:', !!process.env.JWT_SECRET);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
        console.log('Tentando gerar token...');

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
            console.log('Token gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar token:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        // Busca dados completos do usuário usando getUserById
        req.params.id = user.user_id;
        const userResponse = await new Promise((resolve) => {
            getUserById({ params: { id: user.user_id } }, {
                json: (data) => resolve(data),
                status: () => ({ json: () => resolve(null) })
            });
        });

        if (!userResponse) {
            return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
        }

        res.json({ 
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Erro durante autenticação:', {
            mensagem: error.message,
            tipo: error.name,
            stack: error.stack?.split('\n'),
            dados: {
                id: user?.user_id,
                username: user?.username,
                temContatos: !!user?.persons?.person_contacts,
                numContatos: user?.persons?.person_contacts?.length
            }
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
        // Usa a mesma função do getUserById
        req.params.id = req.user.id;
        return getUserById(req, res);
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
