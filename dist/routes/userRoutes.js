"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middleware/authMiddleware");
const logger_1 = __importDefault(require("../config/logger"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
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
router.get('/', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        console.log('Rota de usuários acessada');
        logger_1.default.info('Tentativa de listagem de usuários');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                user_name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        logger_1.default.info('Listagem de usuários realizada');
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Erro na rota de usuários:', error);
        logger_1.default.error('Erro ao listar usuários', error);
        res.status(500).json({
            message: 'Erro ao listar usuários',
            error: error.message
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
router.get('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        console.log('Rota de detalhes de usuário acessada');
        logger_1.default.info('Tentativa de buscar usuário');
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
            console.log('Usuário não encontrado:', id);
            logger_1.default.warn(`Tentativa de buscar usuário inexistente: ${id}`);
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        logger_1.default.info(`Detalhes do usuário obtidos: ${id}`);
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Erro na rota de detalhes de usuário:', error);
        logger_1.default.error('Erro ao buscar usuário', error);
        res.status(500).json({
            message: 'Erro ao buscar usuário',
            error: error.message
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
router.put('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        console.log('Rota de atualização de usuário acessada');
        logger_1.default.info('Tentativa de atualizar usuário');
        const { id } = req.params;
        const { user_name, role } = req.body;
        // Validar entrada
        if (!user_name && !role) {
            console.log('Nenhum dado para atualizar');
            return res.status(400).json({ message: 'Nenhum dado para atualizar' });
        }
        // Preparar dados para atualização
        const updateData = {};
        if (user_name)
            updateData.user_name = user_name;
        if (role)
            updateData.role = role;
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
        logger_1.default.info(`Usuário atualizado: ${id}`);
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error('Erro na rota de atualização de usuário:', error);
        logger_1.default.error('Erro ao atualizar usuário', error);
        // Verificar se o erro é de usuário não encontrado
        if (error.code === 'P2025') {
            console.log('Usuário não encontrado:', error.meta.target);
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.status(500).json({
            message: 'Erro ao atualizar usuário',
            error: error.message
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
router.delete('/:id', authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, async (req, res) => {
    try {
        console.log('Rota de exclusão de usuário acessada');
        logger_1.default.info('Tentativa de excluir usuário');
        const { id } = req.params;
        await prisma.user.delete({
            where: { id }
        });
        logger_1.default.info(`Usuário excluído: ${id}`);
        res.status(200).json({ message: 'Usuário excluído com sucesso' });
    }
    catch (error) {
        console.error('Erro na rota de exclusão de usuário:', error);
        logger_1.default.error('Erro ao excluir usuário', error);
        // Verificar se o erro é de usuário não encontrado
        if (error.code === 'P2025') {
            console.log('Usuário não encontrado:', error.meta.target);
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.status(500).json({
            message: 'Erro ao excluir usuário',
            error: error.message
        });
    }
});
exports.default = router;
