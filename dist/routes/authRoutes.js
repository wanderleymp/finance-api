"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const logger_1 = __importDefault(require("../config/logger"));
const router = (0, express_1.Router)();
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
router.post('/register', validationMiddleware_1.validateRegistration, async (req, res) => {
    try {
        const { user_name, password } = req.body;
        logger_1.default.info('Tentativa de registro de administrador', { user_name });
        const token = await (0, authService_1.registerAdmin)(user_name, password);
        res.status(201).json({
            message: 'Administrador registrado com sucesso',
            token
        });
    }
    catch (error) {
        logger_1.default.error('Erro no registro de administrador', error);
        res.status(500).json({
            message: 'Erro ao registrar administrador',
            error: error.message
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
router.post('/login', authMiddleware_1.loginAttemptMiddleware, validationMiddleware_1.validateLogin, async (req, res) => {
    try {
        const { user_name, password } = req.body;
        logger_1.default.info('Tentativa de login de administrador', { user_name });
        const token = await (0, authService_1.authenticateUser)(user_name, password);
        res.status(200).json({
            message: 'Login realizado com sucesso',
            token
        });
    }
    catch (error) {
        logger_1.default.error('Erro no login de administrador', error);
        res.status(401).json({
            message: 'Erro no login',
            error: error.message
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
router.post('/verify', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }
        const decoded = await (0, authService_1.verifyToken)(token);
        res.status(200).json({
            message: 'Token válido',
            user: decoded
        });
    }
    catch (error) {
        logger_1.default.error('Erro na verificação do token', error);
        res.status(401).json({
            message: 'Token inválido',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map