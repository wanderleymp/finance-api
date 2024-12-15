const UserService = require('../services/userService');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const JwtMiddleware = require('../middlewares/jwtMiddleware');
const TwoFactorAuth = require('../middlewares/security/twoFactorAuth');
const LoginAudit = require('../models/loginAudit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class UserController {
    async register(req, res) {
        try {
            // Remover hash de senha
            const user = await UserService.createUser(req.body);
            
            res.status(201).json({
                status: 'success',
                message: 'Usuário registrado com sucesso',
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    profile_id: user.profile_id
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erro interno ao registrar usuário',
                details: error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;

            logger.info('CONTROLLER: Tentativa de login', { username });

            const loginResult = await UserService.login(username, password);

            res.json({
                accessToken: loginResult.accessToken,
                refreshToken: loginResult.refreshToken,
                user: {
                    user_id: loginResult.user.user_id,
                    username: loginResult.user.username,
                    profile_id: loginResult.user.profile_id,
                    enable_2fa: loginResult.user.enable_2fa
                }
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro no login', { 
                error: error.message,
                stack: error.stack,
                username: req.body.username 
            });

            res.status(500).json({ 
                status: 'error',
                message: 'Erro interno no login',
                details: error.message 
            });
        }
    }

    async enable2FA(req, res) {
        try {
            const userId = req.userId;
            const user = await UserService.getUserById(userId);

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuário não encontrado'
                });
            }

            const secret = TwoFactorAuth.generateSecret(user.username);
            const qrCode = await TwoFactorAuth.generateQRCode(secret);

            // Salva o segredo temporariamente
            await UserService.updateUser(userId, {
                two_factor_secret_temp: secret.base32
            });

            res.json({
                status: 'success',
                message: 'Configuração 2FA iniciada',
                qrCode,
                secret: secret.base32
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro ao habilitar 2FA', {
                error: error.message,
                stack: error.stack,
                userId: req.userId
            });

            res.status(500).json({
                status: 'error',
                message: 'Erro ao habilitar 2FA',
                details: error.message
            });
        }
    }

    async verify2FA(req, res) {
        try {
            const userId = req.userId;
            const { token } = req.body;
            const user = await UserService.getUserById(userId);

            if (!user || !user.two_factor_secret_temp) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Configuração 2FA não iniciada'
                });
            }

            const isValid = TwoFactorAuth.verifyToken({
                base32: user.two_factor_secret_temp
            }, token);

            if (!isValid) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Token 2FA inválido'
                });
            }

            // Ativa 2FA e salva o segredo permanentemente
            await UserService.updateUser(userId, {
                enable_2fa: true,
                two_factor_secret: user.two_factor_secret_temp,
                two_factor_secret_temp: null
            });

            res.json({
                status: 'success',
                message: '2FA ativado com sucesso'
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro ao verificar 2FA', {
                error: error.message,
                stack: error.stack,
                userId: req.userId
            });

            res.status(500).json({
                status: 'error',
                message: 'Erro ao verificar 2FA',
                details: error.message
            });
        }
    }

    async disable2FA(req, res) {
        try {
            const userId = req.userId;
            const user = await UserService.getUserById(userId);

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuário não encontrado'
                });
            }

            await UserService.updateUser(userId, {
                enable_2fa: false,
                two_factor_secret: null,
                two_factor_secret_temp: null
            });

            res.json({
                status: 'success',
                message: '2FA desativado com sucesso'
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro ao desabilitar 2FA', {
                error: error.message,
                stack: error.stack,
                userId: req.userId
            });

            res.status(500).json({
                status: 'error',
                message: 'Erro ao desabilitar 2FA',
                details: error.message
            });
        }
    }

    async listUsers(req, res) {
        try {
            const { page, limit, ...filters } = req.query;
            
            logger.info('CONTROLLER: Listando usuários', { 
                page, 
                limit, 
                filters 
            });

            const users = await UserService.listUsers(page, limit, filters);
            
            logger.info('CONTROLLER: Usuários listados com sucesso', { 
                totalUsers: users.total,
                returnedUsers: users.data.length 
            });

            res.json(users);
        } catch (error) {
            logger.error('CONTROLLER: Erro ao listar usuários', { 
                error: error.message,
                stack: error.stack 
            });

            res.status(500).json({ 
                message: 'Erro ao listar usuários',
                error: error.message 
            });
        }
    }

    async getUser(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('CONTROLLER: Buscando usuário por ID', { id });

            const user = await UserService.getUser(id);
            
            logger.info('CONTROLLER: Usuário encontrado', { 
                username: user.username, 
                user: {
                    user_id: user.user_id,
                    password: '********', // Ocultar senha real
                    active: user.active
                }
            });

            res.json(user);
        } catch (error) {
            logger.error('CONTROLLER: Erro ao buscar usuário', { 
                id: req.params.id,
                error: error.message,
                stack: error.stack 
            });

            if (error instanceof ValidationError) {
                return res.status(error.statusCode || 404).json({
                    message: error.message
                });
            }

            res.status(500).json({ 
                message: 'Erro ao buscar usuário',
                error: error.message 
            });
        }
    }

    async getUsersByPerson(req, res) {
        try {
            const { personId } = req.params;
            
            logger.info('CONTROLLER: Buscando usuários por pessoa', { personId });

            const users = await UserService.findByPerson(personId);
            
            logger.info('CONTROLLER: Usuários encontrados', { 
                personId,
                totalUsers: users.length 
            });

            res.json(users);
        } catch (error) {
            logger.error('CONTROLLER: Erro ao buscar usuários por pessoa', { 
                personId: req.params.personId,
                error: error.message,
                stack: error.stack 
            });

            res.status(500).json({ 
                message: 'Erro ao buscar usuários por pessoa',
                error: error.message 
            });
        }
    }

    async createUser(req, res) {
        try {
            logger.info('CONTROLLER: Criando usuário', { 
                body: req.body,
                personId: req.body.person_id 
            });

            const user = await UserService.createUser(req.body);
            
            logger.info('CONTROLLER: Usuário criado com sucesso', { 
                userId: user.user_id,
                username: user.username 
            });

            res.status(201).json({
                message: 'Usuário criado com sucesso',
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro ao criar usuário', { 
                error: error.message,
                stack: error.stack,
                body: req.body 
            });

            if (error instanceof ValidationError) {
                return res.status(error.statusCode || 400).json({
                    message: error.message,
                    details: error.details
                });
            }

            res.status(500).json({ 
                message: 'Erro interno ao criar usuário',
                error: error.message 
            });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            logger.info('CONTROLLER: Atualizando usuário', { 
                id, 
                updateData 
            });

            const user = await UserService.updateUser(id, updateData);
            
            logger.info('CONTROLLER: Usuário atualizado com sucesso', { 
                userId: user.user_id,
                username: user.username 
            });

            res.json({
                message: 'Usuário atualizado com sucesso',
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro ao atualizar usuário', { 
                id: req.params.id,
                error: error.message,
                stack: error.stack,
                body: req.body 
            });

            if (error instanceof ValidationError) {
                return res.status(error.statusCode || 400).json({
                    message: error.message,
                    details: error.details
                });
            }

            res.status(500).json({ 
                message: 'Erro interno ao atualizar usuário',
                error: error.message 
            });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('CONTROLLER: Deletando usuário', { id });

            const user = await UserService.deleteUser(id);
            
            logger.info('CONTROLLER: Usuário deletado com sucesso', { 
                userId: user.user_id,
                username: user.username 
            });

            res.json({
                message: 'Usuário desativado com sucesso',
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    active: user.active
                }
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro ao deletar usuário', { 
                id: req.params.id,
                error: error.message,
                stack: error.stack 
            });

            if (error instanceof ValidationError) {
                return res.status(error.statusCode || 400).json({
                    message: error.message
                });
            }

            res.status(500).json({ 
                message: 'Erro interno ao deletar usuário',
                error: error.message 
            });
        }
    }

    async listUsers(req, res) {
        try {
            const { page, limit, ...filters } = req.query;
            const result = await UserService.listUsers(page, limit, filters);
            
            res.status(200).json(result);
        } catch (error) {
            logger.error('CONTROLLER: Erro ao listar usuários', { 
                error: error.message,
                stack: error.stack 
            });

            res.status(500).json({ 
                message: 'Erro interno ao listar usuários',
                error: error.message 
            });
        }
    }

    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await UserService.getUserById(id);
            
            res.status(200).json(user);
        } catch (error) {
            logger.error('CONTROLLER: Erro ao buscar usuário', { 
                error: error.message,
                stack: error.stack,
                userId: req.params.id 
            });

            res.status(404).json({ 
                message: 'Usuário não encontrado',
                error: error.message 
            });
        }
    }

    async createUser(req, res) {
        try {
            const user = await UserService.createUser(req.body);
            
            res.status(201).json({
                message: 'Usuário criado com sucesso',
                user
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro ao criar usuário', { 
                error: error.message,
                stack: error.stack,
                body: req.body 
            });

            res.status(400).json({ 
                message: 'Erro ao criar usuário',
                error: error.message 
            });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updatedUser = await UserService.updateUser(id, req.body);
            
            res.status(200).json({
                message: 'Usuário atualizado com sucesso',
                user: updatedUser
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro ao atualizar usuário', { 
                error: error.message,
                stack: error.stack,
                userId: req.params.id,
                body: req.body 
            });

            res.status(400).json({ 
                message: 'Erro ao atualizar usuário',
                error: error.message 
            });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            await UserService.deleteUser(id);
            
            res.status(200).json({
                message: 'Usuário excluído com sucesso'
            });
        } catch (error) {
            logger.error('CONTROLLER: Erro ao excluir usuário', { 
                error: error.message,
                stack: error.stack,
                userId: req.params.id 
            });

            res.status(400).json({ 
                message: 'Erro ao excluir usuário',
                error: error.message 
            });
        }
    }

    async getUsersByPerson(req, res) {
        try {
            const { personId } = req.params;
            const users = await UserService.getUsersByPerson(personId);
            
            res.status(200).json(users);
        } catch (error) {
            logger.error('CONTROLLER: Erro ao buscar usuários por pessoa', { 
                error: error.message,
                stack: error.stack,
                personId: req.params.personId 
            });

            res.status(404).json({ 
                message: 'Usuários não encontrados para esta pessoa',
                error: error.message 
            });
        }
    }

    async updatePassword(req, res) {
        try {
            const { userId } = req.params;
            const { newPassword } = req.body;

            logger.info('CONTROLLER: Iniciando atualização de senha', { 
                userId 
            });

            const result = await UserService.updatePassword(
                parseInt(userId), 
                null, 
                newPassword
            );

            res.status(200).json(result);
        } catch (error) {
            logger.error('CONTROLLER: Erro ao atualizar senha', { 
                error: error.message,
                userId: req.params.userId 
            });

            if (error instanceof ValidationError) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Erro interno ao atualizar senha'
            });
        }
    }
}

module.exports = new UserController();